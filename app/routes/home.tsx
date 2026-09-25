import { useWorkflows, Workflow, workflowTitle } from "@/features/workflow";
import { EmptyWorkflow } from "@/features/workflow/components/empty-workflow";

import { SiteHeader } from "@/components/site-header";

export default function Home() {
  const { workflows, currentId, add } = useWorkflows();
  const current = workflows.find((w) => w.id === currentId);
  const title = current ? workflowTitle(current) : "";

  return (
    <>
      <SiteHeader title={title} />
      {currentId && current ? (
        <Workflow key={currentId} workflowId={currentId} />
      ) : (
        <EmptyWorkflow onCreate={add} />
      )}
    </>
  );
}
