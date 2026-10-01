'use client';
// DSP-40 Agent proposal in draft, live. Markup and classes from the generated design
// (frontend/screens/dsp-40-agent-proposal-in-draft.tsx). "Apply to draft" sends AgentRuns('…')/Lodestar.Resume
// {decision: 'edit', edits} — a new draft version that still needs a human approval (DSP-12); "Dismiss" drops it.
import AgentBoardScreen from '@/components/live/AgentBoardScreen';

export default function LiveDsp40AgentProposalInDraft() {
  return <AgentBoardScreen name="DSP-40 Agent proposal in draft · desktop" mode="proposal" />;
}
