import React, { useState } from 'react';
import { Bell, HelpCircle, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  date: Date;
}

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Review Ethics Application',
      description: 'Review the submitted ethics application for research project',
      completed: false,
      date: new Date(2025, 10, 10),
    },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredTasks = tasks.filter(
    (task) => format(task.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
  );

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      description: newTaskDescription,
      completed: false,
      date: selectedDate,
    };

    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setIsDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-secondary/30">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-card border-b border-border px-4 py-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="p-2 hover:bg-accent rounded-lg transition-colors" />
                <h1 className="text-base font-normal text-foreground hidden sm:block">
                  Final International University Ethic committee
                </h1>
              </div>


            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              My Agenda
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Calendar
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Select a date to view and add tasks
                </p>

                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className={cn("rounded-md border pointer-events-auto mx-auto")}
                />
              </div>

              {/* Tasks Section */}
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Tasks
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>

                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Task</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <Input
                            placeholder="Task title"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                          />
                        </div>
                        <div>
                          <Textarea
                            placeholder="Task description"
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <Button onClick={handleAddTask} className="w-full">
                          Add Task
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4">
                  {filteredTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks for this date
                    </p>
                  ) : (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(task.id)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h4
                              className={cn(
                                "font-medium text-foreground mb-1",
                                task.completed && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </main>

          {/* Help Button */}

        </div>
      </div>
    </SidebarProvider>
  );
};

export default Agenda;
