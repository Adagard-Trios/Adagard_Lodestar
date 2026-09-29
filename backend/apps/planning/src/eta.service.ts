import { Injectable } from '@nestjs/common';
import { PrismaService } from '@lodestar/prisma';
import { DockType, Brand } from '@prisma/client';

/**
 * ETA Service — computes plan ETA (free-flow) and model ETA (ML-adjusted).
 *
 * From STORY.md / training data:
 *   - Plan ETA = departure + depot→district + Σ inter-stop + Σ service allowances
 *   - Model ETA for Nuwara Eliya hill road in monsoon:
 *       traffic_speed.csv speed index drops to 64 at 5 AM, 58 at 6 AM, 48 at 7 AM
 *       Monsoon hill runs average ~80 min behind free-flow plan
 *   - OUT106 late risk: 12% when planned before 6:00 AM (monsoon)
 *   - OUT108 late risk: 18% normal, 61% during blackout
 */
@Injectable()
export class EtaService {
  constructor(private prisma: PrismaService) {}

  /** Service allowance in minutes from DB */
  async getServiceMin(brand: Brand, dockType: DockType): Promise<number> {
    const sa = await this.prisma.serviceAllowance.findUnique({
      where: { brand_dockType: { brand, dockType } },
    });
    return sa?.minutes ?? 15;
  }

  /** Free-flow plan ETA for a stop */
  computePlanEta(params: {
    departTime: Date;
    depotToDistMin: number;
    priorStopServiceMins: number;   // sum of service mins for stops before this one
    priorInterStopMins: number;     // inter-stop travel for stops before this one
    interStopMin: number;           // to this stop
    serviceMin: number;             // at this stop
  }): Date {
    const totalMin =
      params.depotToDistMin +
      params.priorStopServiceMins +
      params.priorInterStopMins +
      params.interStopMin;

    const eta = new Date(params.departTime);
    eta.setMinutes(eta.getMinutes() + totalMin);
    return eta;
  }

  /**
   * Model ETA — adjusts plan ETA based on road class, time-of-day, monsoon.
   * Hill roads in monsoon: +80 min median delay vs free-flow.
   * Returns { etaModel, bandEarly, bandLate, lateRiskPct }
   */
  computeModelEta(params: {
    etaPlan: Date;
    roadClass: string;
    isMonsoon: boolean;
    plannedHour: number;    // hour of planned arrival (IST)
    windowClose: string;    // "08:00"
  }): { etaModel: Date; bandEarly: Date; bandLate: Date; lateRiskPct: number } {
    let delayMin = 0;
    let bandWidthMin = 15;
    let lateRiskPct = 5;

    if (params.roadClass === 'hill' && params.isMonsoon) {
      // Traffic speed index: 5AM=64, 6AM=58, 7AM=48 → slowdowns
      const speedIndex = params.plannedHour <= 5 ? 64 : params.plannedHour <= 6 ? 58 : 48;
      // At full speed (100) → 0 delay; at 64 → ~55% slower → ~80 min delay
      delayMin = Math.round((100 - speedIndex) / 100 * 80);
      bandWidthMin = 20;

      // Late risk: before 6AM in monsoon → 20% (from training: 51 runs, 20% late)
      if (params.plannedHour < 6) {
        lateRiskPct = params.isMonsoon ? 20 : 10;
      } else {
        lateRiskPct = params.isMonsoon ? 53 : 20;
      }
    } else if (params.roadClass === 'urban') {
      delayMin = params.plannedHour < 6 ? 0 : 10;
      lateRiskPct = 8;
    } else if (params.roadClass === 'suburban') {
      delayMin = params.isMonsoon ? 15 : 5;
      lateRiskPct = 12;
    }

    const etaModel = new Date(params.etaPlan);
    etaModel.setMinutes(etaModel.getMinutes() + delayMin);

    const bandEarly = new Date(etaModel);
    bandEarly.setMinutes(bandEarly.getMinutes() - bandWidthMin);

    const bandLate = new Date(etaModel);
    bandLate.setMinutes(bandLate.getMinutes() + bandWidthMin);

    // Recompute late risk based on whether model ETA exceeds window
    const [wh, wm] = params.windowClose.split(':').map(Number);
    const windowCloseMin = wh * 60 + wm;
    const modelEtaMin = etaModel.getHours() * 60 + etaModel.getMinutes();
    if (modelEtaMin > windowCloseMin - 30) {
      lateRiskPct = Math.min(lateRiskPct + 30, 95);
    }

    return { etaModel, bandEarly, bandLate, lateRiskPct };
  }
}
