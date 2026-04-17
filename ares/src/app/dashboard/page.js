'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [brainstorms, setBrainstorms] = useState([]);

  useEffect(() => {
    // Projects
    const projectsRef = collection(db, 'projects');
    const projectsUnsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    });

    // Tasks (agent_inbox)
    const tasksRef = collection(db, 'agent_inbox');
    const tasksUnsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });

    // Agent status
    const agentStatusRef = collection(db, 'agent_state');
    const agentStatusUnsubscribe = onSnapshot(agentStatusRef, (snapshot) => {
      const statusData = {};
      snapshot.forEach(doc => {
        statusData[doc.id] = doc.data();
      });
      setAgentStatus(statusData);
    });

    // Brainstorms
    const brainstormsRef = collection(db, 'brainstorm_history');
    const brainstormsUnsubscribe = onSnapshot(brainstormsRef, (snapshot) => {
      const brainstormsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBrainstorms(brainstormsData);
    });

    return () => {
      projectsUnsubscribe();
      tasksUnsubscribe();
      agentStatusUnsubscribe();
      brainstormsUnsubscribe();
    };
  }, []);

  return (
    <DashboardLayout
      projects={projects}
      tasks={tasks}
      agentStatus={agentStatus}
      brainstorms={brainstorms}
    />
  );
}
