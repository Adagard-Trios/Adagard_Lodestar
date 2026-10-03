import { Injectable } from '@nestjs/common';
import { TempClass, Brand } from '@prisma/client';
import { DEFERRAL_CANDIDATE_BELOW, DEFERRAL_WEIGHTS as W, PROTECTED_SCORE } from './planning-rules';

/**
 * Deferral Scoring Service
 * Score formula (from STORY.md; the weights live in planning-rules.ts and are served by PlanningRules):
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

    if (params.deferredYesterday) score += W.deferredYesterday;
    score += params.daysSince * W.perDaySince;
    if (params.tempClass === TempClass.CHILLED) score += W.chilled;

    // Fresh before-opening bonus (window opens before freshBeforeHour = Fresh morning run)
    const [wh] = params.windowOpen.split(':').map(Number);
    if (params.brand === Brand.FRESH && wh < W.freshBeforeHour) score += W.freshBeforeOpening;

    if (params.nextRunWithin24h) score += W.nextRunWithin24h;

    // Stock cover heuristic: more cover = lower urgency
    if (params.stockCoverDays !== undefined) {
      score += Math.max(params.stockCoverDays * W.stockCoverPerDay, -W.stockCoverCap);
    }

    return Math.max(0, score);
  }

  isProtected(score: number): boolean {
    return score >= PROTECTED_SCORE;
  }

  isDeferralCandidate(score: number): boolean {
    return score < DEFERRAL_CANDIDATE_BELOW && !this.isProtected(score);
  }
}
