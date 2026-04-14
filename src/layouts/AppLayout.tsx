import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from '../components/layout/Sidebar';
import TopNav from '../components/layout/TopNav';
import RightPanel from '../components/layout/RightPanel';
import LectureViewer from '../components/content/LectureViewer';
import UploadModal from '../components/upload/UploadModal';
import { simulateAuth } from '../services/aws/cognito';
import { useUIStore } from '../store/lectureStore';

interface AppUser {
    name: string;
    email: string;
    plan: string;
    institution?: string;
}

export default function AppLayout() {
    const [user, setUser] = useState<AppUser | null>(null);
    const { } = useUIStore();

    useEffect(() => {
        // AWS_INTEGRATION: Replace with Amplify Auth.getCurrentUser()
        simulateAuth().then(setUser);
    }, []);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-surface-0">
            {/* Top Navigation */}
            <TopNav user={user} />

            {/* Main layout: Sidebar | Content | RightPanel */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar */}
                <Sidebar />

                {/* Main content area */}
                <motion.main
                    className="flex-1 overflow-hidden bg-surface-1/40 flex flex-col"
                    layout
                    transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                >
                    <LectureViewer />
                </motion.main>

                {/* Right panel */}
                <RightPanel />
            </div>

            {/* Upload Modal */}
            <UploadModal />
        </div>
    );
}
