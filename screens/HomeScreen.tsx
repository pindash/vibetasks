import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  Linking,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';

export default function HomeScreen() {
  const [taskName, setTaskName] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState(50);
  const [tasks, setTasks] = useState([]);
  
  // Load saved tasks from AsyncStorage
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = await AsyncStorage.getItem('vibeTasks');
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks);
          // Convert date strings back to Date objects
          const processedTasks = parsedTasks.map(task => ({
            ...task,
            dueDate: new Date(task.dueDate)
          }));
          setTasks(processedTasks);
        }
      } catch (e) {
        console.error("Error loading saved tasks", e);
      }
    };
    
    loadTasks();
  }, []);
  
  // Save tasks to AsyncStorage whenever they change
  useEffect(() => {
    const saveTasks = async () => {
      try {
        await AsyncStorage.setItem('vibeTasks', JSON.stringify(tasks));
      } catch (e) {
        console.error("Error saving tasks", e);
      }
    };
    
    saveTasks();
  }, [tasks]);

  const getUrgencyText = (level) => {
    if (level < 10) return "Never in a million years";
    if (level < 25) return "Eventually... maybe";
    if (level < 40) return "When I get around to it";
    if (level < 60) return "Somewhat important";
    if (level < 75) return "Pretty urgent";
    if (level < 90) return "Very urgent!";
    return "ASAP!!! Life or death!!!";
  };

  const getUrgencyColor = (level) => {
    // Color gradient from cool blue (low urgency) to hot red (high urgency)
    if (level < 20) return '#3498db';
    if (level < 40) return '#2ecc71';
    if (level < 60) return '#f39c12';
    if (level < 80) return '#e67e22';
    return '#e74c3c';
  };

  const calculateDueDate = (urgencyLevel) => {
    const now = new Date();
    let dueDate = new Date();
    
    if (urgencyLevel > 90) {
      // In the next few hours
      dueDate.setHours(now.getHours() + 2);
    } else if (urgencyLevel > 75) {
      // Today
      dueDate.setHours(now.getHours() + 5);
    } else if (urgencyLevel > 60) {
      // Tomorrow
      dueDate.setDate(now.getDate() + 1);
    } else if (urgencyLevel > 40) {
      // This week
      dueDate.setDate(now.getDate() + 3);
    } else if (urgencyLevel > 25) {
      // Next week
      dueDate.setDate(now.getDate() + 7);
    } else if (urgencyLevel > 10) {
      // Next month
      dueDate.setMonth(now.getMonth() + 1);
    } else {
      // Someday (3 months from now)
      dueDate.setMonth(now.getMonth() + 3);
    }
    
    return dueDate;
  };

  const generateICSContent = (taskName, dueDate) => {
    const startTime = dueDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endTime = new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    
    return `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:${taskName}
DTSTART:${startTime}
DTEND:${endTime}
DESCRIPTION:Task created with Vibe Task Scheduler
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
  };

  const generateCalendarLink = (taskName, dueDate) => {
    const encodedName = encodeURIComponent(taskName);
    const startISO = dueDate.toISOString().replace(/-|:|\.\d+/g, '');
    const endISO = new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d+/g, '');
    
    // Google Calendar link
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedName}&dates=${startISO}/${endISO}&details=Task created with Vibe Task Scheduler`;
  };

  const addTask = () => {
    if (taskName.trim() === '') return;
    
    const dueDate = calculateDueDate(urgencyLevel);
    const icsContent = generateICSContent(taskName, dueDate);
    const calLink = generateCalendarLink(taskName, dueDate);
    
    const newTask = {
      id: Date.now().toString(),
      name: taskName,
      urgencyLevel,
      dueDate,
      icsContent,
      calLink,
    };
    
    setTasks([newTask, ...tasks]);
    setTaskName('');
    setUrgencyLevel(50);
  };

  const openCalendarLink = (link) => {
    Linking.openURL(link).catch(err => {
      console.error("Failed to open calendar link", err);
    });
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getFormattedDate = (date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} at ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
  };

  const getCurrentEmoji = () => {
    if (urgencyLevel < 10) return "😴";
    if (urgencyLevel < 25) return "🙂";
    if (urgencyLevel < 40) return "🤔";
    if (urgencyLevel < 60) return "😐";
    if (urgencyLevel < 75) return "😬";
    if (urgencyLevel < 90) return "😰";
    return "🔥";
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a2a6c', '#b21f1f', '#fdbb2d']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.title}>Vibe Task Scheduler</Text>
          <Text style={styles.subtitle}>Schedule by feeling, not by thinking</Text>
        </View>
      </LinearGradient>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          value={taskName}
          onChangeText={setTaskName}
        />
        
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>The vibe is...</Text>
          <View style={styles.emojiContainer}>
            <Text style={styles.urgencyEmoji}>{getCurrentEmoji()}</Text>
            <Text 
              style={[
                styles.urgencyText, 
                { color: getUrgencyColor(urgencyLevel) }
              ]}
            >
              {getUrgencyText(urgencyLevel)}
            </Text>
          </View>
          
          <View style={styles.sliderRow}>
            <Text style={styles.sliderMinLabel}>Never ever</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={urgencyLevel}
              onValueChange={setUrgencyLevel}
              minimumTrackTintColor={getUrgencyColor(urgencyLevel)}
              maximumTrackTintColor="#EEEEEE"
              thumbTintColor={getUrgencyColor(urgencyLevel)}
            />
            <Text style={styles.sliderMaxLabel}>ASAP!!!</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={addTask}
        >
          <LinearGradient
            colors={[
              getUrgencyColor(urgencyLevel),
              getUrgencyColor(Math.min(urgencyLevel + 20, 100))
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>Add Task</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Text style={styles.taskListTitle}>Your Vibe-Scheduled Tasks</Text>

      <ScrollView style={styles.tasksContainer}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 60, color: '#ccc' }}>📅</Text>
            <Text style={styles.emptyStateText}>
              No tasks yet. Add your first vibe-based task!
            </Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View 
              key={task.id} 
              style={[
                styles.taskItem, 
                { borderLeftColor: getUrgencyColor(task.urgencyLevel) }
              ]}
            >
              <View style={styles.taskContent}>
                <Text style={styles.taskName}>{task.name}</Text>
                <View style={styles.taskDueDateContainer}>
                  <MaterialIcons name="access-time" size={16} color="#666" />
                  <Text style={styles.taskDueDate}>
                    {getFormattedDate(new Date(task.dueDate))}
                  </Text>
                </View>
                <View style={styles.urgencyIndicator}>
                  <View 
                    style={[
                      styles.urgencyBar, 
                      { 
                        width: `${task.urgencyLevel}%`,
                        backgroundColor: getUrgencyColor(task.urgencyLevel),
                      }
                    ]}
                  />
                </View>
              </View>
              
              <View style={styles.calendarButtonContainer}>
                <TouchableOpacity 
                  style={styles.calendarButton}
                  onPress={() => openCalendarLink(task.calLink)}
                >
                  <FontAwesome name="calendar-plus-o" size={18} color="#4a6fa5" />
                  <Text style={styles.calendarButtonText}>Add to Calendar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => deleteTask(task.id)}
                >
                  <FontAwesome name="trash-o" size={18} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Vibe Task Scheduler - Your tasks are saved on this device
        </Text>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} • Made with ❤️ and good vibes
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  inputContainer: {
    margin: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  sliderMinLabel: {
    fontSize: 12,
    color: '#3498db',
  },
  sliderMaxLabel: {
    fontSize: 12,
    color: '#e74c3c',
  },
  emojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  urgencyEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 18,
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  addButtonGradient: {
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 8,
    color: '#333',
  },
  tasksContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  taskItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 5,
  },
  taskContent: {
    padding: 16,
  },
  taskName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  taskDueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskDueDate: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  urgencyIndicator: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    overflow: 'hidden',
  },
  urgencyBar: {
    height: '100%',
  },
  calendarButtonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  calendarButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  calendarButtonText: {
    color: '#4a6fa5',
    marginLeft: 6,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    maxWidth: '80%',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
});