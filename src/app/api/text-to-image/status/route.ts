import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db";
import { generatedImages } from "../../../../db/schema";
import { eq } from "drizzle-orm";

// Endpoint para polling de status da tarefa
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) {
    return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
  }
  try {
    const [task] = await db.select().from(generatedImages).where(eq(generatedImages.taskId, taskId));
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    let frontendStatus = task.status;
    if (task.status === 'pending') frontendStatus = 'Pending';
    else if (task.status === 'ready') frontendStatus = 'Ready';
    else if (task.status === 'error') frontendStatus = 'Error';
    const statusData = {
      status: frontendStatus,
      taskId: taskId,
      imageUrl: task.imageUrl || null
    };
    return NextResponse.json(statusData);
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}