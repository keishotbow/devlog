'use client';
import { Box, Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItem, ListItemText, Checkbox } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { PlanData } from '../app/(dashboard)/page';

interface PlanTaskListProps {
    planData: PlanData;
    onTaskToggle: (weekIndex: number, dayIndex: number, taskIndex: number) => void;
}

export default function PlanTaskList({ planData, onTaskToggle }: PlanTaskListProps) {
    return (
        <Box sx={{ mt: 2 }}>
            {(planData.weeks || []).map((week, weekIndex) => (
                <Accordion key={`${week.weekNumber}-${weekIndex}`} defaultExpanded={weekIndex === 0}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Week {week.weekNumber}: {week.weeklyGoal}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List dense>
                            {(week.dailyTasks || []).map((day, dayIndex) => (
                                <Box key={`${week.weekNumber}-${day.day}-${dayIndex}`} sx={{ mb: 1 }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{day.day}</Typography>
                                    {(day.tasks || []).map((task, taskIndex) => (
                                        <ListItem
                                            key={`${week.weekNumber}-${dayIndex}-${taskIndex}`}
                                            secondaryAction={
                                                <Checkbox
                                                    edge="end"
                                                    // ★★★ 修正点: `undefined`を`false`に変換する ★★★
                                                    checked={!!task.isCompleted}
                                                    onChange={() => onTaskToggle(weekIndex, dayIndex, taskIndex)}
                                                />
                                            }
                                            disablePadding
                                        >
                                            <ListItemText
                                                primary={task.description}
                                                secondary={`目安: ${task.estimatedTime}分`}
                                                sx={{ textDecoration: task.isCompleted ? 'line-through' : 'none', opacity: task.isCompleted ? 0.6 : 1 }}
                                            />
                                        </ListItem>
                                    ))}
                                </Box>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
}

