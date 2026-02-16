/**
 * ClickUp Tasks API
 * Create and manage tasks for Angelina
 */

import { NextResponse } from "next/server";
import { clickup } from "@/lib/integrations";

export async function GET() {
  try {
    const workspaces = await clickup.getWorkspaces();
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error("[ClickUp API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ClickUp error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { action, listId, name, description, taskId, status } = await request.json();

    switch (action) {
      case 'create':
        if (!listId || !name) {
          return NextResponse.json({ error: "listId and name required" }, { status: 400 });
        }
        const task = await clickup.createTask(listId, name, description);
        return NextResponse.json({ task });

      case 'getTasks':
        if (!listId) {
          return NextResponse.json({ error: "listId required" }, { status: 400 });
        }
        const tasks = await clickup.getTasks(listId);
        return NextResponse.json({ tasks });

      case 'updateStatus':
        if (!taskId || !status) {
          return NextResponse.json({ error: "taskId and status required" }, { status: 400 });
        }
        const updated = await clickup.updateTaskStatus(taskId, status);
        return NextResponse.json({ success: updated });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[ClickUp API] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ClickUp error" },
      { status: 500 }
    );
  }
}
