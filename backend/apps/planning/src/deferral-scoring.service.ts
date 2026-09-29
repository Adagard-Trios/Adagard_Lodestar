import { Injectable } from '@nestjs/common';
import { TempClass, DockType, Brand } from '@prisma/client';

/**
 * Deferral Scoring Service
 * Score formula (from STORY.md):
 *   deferred_yesterday: +40
 *   days_since:          ×12 per day
 *   chilled:            +15
 *   fresh_before_opening:+10
 *   next_run_within_24h: -10
 *   stock_cover_term:   variable
 *
 * Score ≥ 91 → PROTECTED (never defer)
 * Score < 30  → suggest deferral
 */
@Injectable()
export class DeferralScoringService {

  computeScore(params: {
    deferredYesterday: boolean;
    daysSince: number;
    tempClass: TempClass;
    brand: Brand;
    windowOpen: string;    // "05:30"
    nextRunWithin24h: boolean;
    stockCoverDays?: number;
  }): number {
    let score = 0;

    if (params.deferredYesterday)   score += 40;
    score += params.daysSince * 12;
    if (params.tempClass === TempClass.CHILLED) score += 15;

    // Fresh before-opening bonus (window opens before 08:00 = Fresh morning run)
    const [wh] = params.windowOpen.split(':').map(Number);
    if (params.brand === Brand.FRESH && wh < 8) score += 10;

    if (params.nextRunWithin24h) score -= 10;

    // Stock cover heuristic: more cover = lower urgency
    if (params.stockCoverDays !== undefined) {
      score -= Math.min(params.stockCoverDays * 5, 20);
    }

    return Math.max(0, score);
  }

  isProtected(score: number): boolean {
    return score >= 91;
  }

  isDeferralCandidate(score: number): boolean {
    return score < 30 && !this.isProtected(score);
  }
}
