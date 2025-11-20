/**
 * Project detection utilities
 *
 * Extracts project names from task IDs for multi-project filtering
 */

/**
 * Task interface with minimal required properties
 */
export interface Task {
  id: string;
  [key: string]: any; // Allow additional properties
}

/**
 * Extract project name from a task ID
 *
 * @param taskId - Task ID (e.g., "chimaro-abc", "jomarchy-xyz")
 * @returns Project name or null if no valid prefix
 *
 * @example
 * getProjectFromTaskId("chimaro-abc") // "chimaro"
 * getProjectFromTaskId("jat-bov") // "jat"
 * getProjectFromTaskId("invalid") // null
 */
export function getProjectFromTaskId(taskId: string): string | null {
  if (!taskId || typeof taskId !== 'string') {
    return null;
  }

  // Task IDs should be in format: "project-hash" (e.g., "chimaro-abc", "jat-bov")
  // Project prefix must be followed by a hyphen and at least one character
  const match = taskId.match(/^([a-zA-Z0-9_-]+?)-([a-zA-Z0-9]+)$/);

  if (!match) {
    return null;
  }

  const [, projectPrefix] = match;

  // Validate project prefix (shouldn't be empty or just hyphens)
  if (!projectPrefix || projectPrefix.trim() === '' || /^-+$/.test(projectPrefix)) {
    return null;
  }

  return projectPrefix;
}

/**
 * Extract unique project names from a list of tasks
 *
 * @param tasks - Array of task objects with id property
 * @returns Sorted array of project names with "All Projects" as first item
 *
 * @example
 * const tasks = [
 *   { id: "chimaro-abc", title: "Task 1" },
 *   { id: "jomarchy-xyz", title: "Task 2" },
 *   { id: "chimaro-def", title: "Task 3" },
 *   { id: "jat-ghi", title: "Task 4" }
 * ];
 *
 * getProjectsFromTasks(tasks)
 * // ["All Projects", "chimaro", "jat", "jomarchy"]
 */
export function getProjectsFromTasks(tasks: Task[]): string[] {
  if (!Array.isArray(tasks)) {
    return ['All Projects'];
  }

  // Extract unique project names
  const projectsSet = new Set<string>();

  for (const task of tasks) {
    if (!task || !task.id) {
      continue;
    }

    const project = getProjectFromTaskId(task.id);
    if (project) {
      projectsSet.add(project);
    }
  }

  // Convert to array and sort alphabetically
  const projects = Array.from(projectsSet).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' })
  );

  // Always return "All Projects" as the first option
  return ['All Projects', ...projects];
}

/**
 * Count tasks per project
 *
 * @param tasks - Array of task objects
 * @returns Map of project name to task count
 *
 * @example
 * const tasks = [
 *   { id: "chimaro-abc" },
 *   { id: "chimaro-def" },
 *   { id: "jat-ghi" }
 * ];
 *
 * getTaskCountByProject(tasks)
 * // Map { "chimaro" => 2, "jat" => 1 }
 */
export function getTaskCountByProject(tasks: Task[]): Map<string, number> {
  const counts = new Map<string, number>();

  if (!Array.isArray(tasks)) {
    return counts;
  }

  for (const task of tasks) {
    if (!task || !task.id) {
      continue;
    }

    const project = getProjectFromTaskId(task.id);
    if (project) {
      counts.set(project, (counts.get(project) || 0) + 1);
    }
  }

  return counts;
}

/**
 * Get filesystem path for a project based on task ID
 *
 * @param taskId - Task ID with project prefix (e.g., "chimaro-abc", "jat-xyz")
 * @returns Absolute path to project directory, or null if project cannot be determined
 *
 * @example
 * getProjectPath("chimaro-abc") // "/home/user/code/chimaro"
 * getProjectPath("jat-xyz") // "/home/user/code/jat"
 * getProjectPath("invalid") // null
 */
export function getProjectPath(taskId: string): string | null {
  const projectName = getProjectFromTaskId(taskId);

  if (!projectName) {
    return null;
  }

  // Map project name to filesystem path
  // All projects are in ~/code/{project-name}
  const homeDir = process.env.HOME || '~';
  return `${homeDir}/code/${projectName}`;
}

/**
 * Filter tasks by project name
 *
 * @param tasks - Array of task objects
 * @param projectName - Project to filter by ("All Projects" returns all tasks)
 * @returns Filtered array of tasks
 *
 * @example
 * const tasks = [
 *   { id: "chimaro-abc", title: "Task 1" },
 *   { id: "jat-def", title: "Task 2" }
 * ];
 *
 * filterTasksByProject(tasks, "chimaro")
 * // [{ id: "chimaro-abc", title: "Task 1" }]
 *
 * filterTasksByProject(tasks, "All Projects")
 * // [{ id: "chimaro-abc", title: "Task 1" }, { id: "jat-def", title: "Task 2" }]
 */
export function filterTasksByProject(tasks: Task[], projectName: string): Task[] {
  if (!Array.isArray(tasks)) {
    return [];
  }

  // "All Projects" returns everything
  if (projectName === 'All Projects' || !projectName) {
    return tasks;
  }

  return tasks.filter(task => {
    if (!task || !task.id) {
      return false;
    }

    const taskProject = getProjectFromTaskId(task.id);
    return taskProject === projectName;
  });
}
