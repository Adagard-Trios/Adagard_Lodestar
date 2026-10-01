'use client';
// DSP-39 Ask the planning agent, live. Markup and classes from the generated design
// (frontend/screens/dsp-39-ask-the-planning-agent.tsx). Data: the AgentRuns draft under review and
// AgentRuns('…')/Lodestar.Ask; an answer that proposes an edit follows the design link to DSP-40.
import AgentBoardScreen from '@/components/live/AgentBoardScreen';

export default function LiveDsp39AskThePlanningAgent() {
  return <AgentBoardScreen name="DSP-39 Ask the planning agent · desktop" mode="ask" />;
}
