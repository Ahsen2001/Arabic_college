import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';
import { Printer, ArrowLeft, Award } from 'lucide-react';

interface StudentData {
  student_id: number;
  student_id_number: string;
  name: string;
  program: string;
  milestones: Array<{
    milestone_name: string;
    completion_date: string;
    remarks?: string;
  }>;
}

const HifzKhatmCertificate: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress();
  }, [studentId]);

  const fetchStudentProgress = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/hifz/student/${studentId}/progress`);
      setStudent(response.data.data);
    } catch (error) {
      toast.error('Failed to load student milestone details.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fullscreen-loader">
        <div className="loader-card">
          <div className="spinner"></div>
          <p className="loading-text">Generating Khatm Certificate...</p>
        </div>
      </div>
    );
  }

  if (!student) return null;

  // Find graduation / Khatm date
  const khatmMilestone = student.milestones.find(m => m.milestone_name.toLowerCase().includes('khatm') || m.milestone_name.toLowerCase().includes('full quran'));
  const completionDate = khatmMilestone ? khatmMilestone.completion_date : new Date().toISOString().slice(0, 10);

  return (
    <div className="dashboard-wrapper printable-admission-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Navbar - Screen only */}
      <nav className="dashboard-nav no-print" style={{ marginBottom: '40px' }}>
        <div className="nav-container">
          <button onClick={() => navigate(-1)} className="btn btn-outline btn-sm flex-center">
            <ArrowLeft size={14} style={{ marginRight: '6px' }} /> Back
          </button>
          <span className="brand-logo">Certificate Registry</span>
          <button onClick={handlePrint} className="btn btn-primary btn-sm flex-center">
            <Printer size={14} style={{ marginRight: '6px' }} /> Print Certificate
          </button>
        </div>
      </nav>

      {/* Screen Preview Container (Centered card style) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'center', padding: '0 20px 40px' }}>
        <div className="dashboard-card" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '30px' }}>
          <Award size={48} style={{ color: '#d4af37', margin: '0 auto 16px' }} />
          <h3>Khatm Certificate Unlocked</h3>
          <p className="card-desc" style={{ marginBottom: '20px' }}>This student has completed full Quran memorization. Click print above to download or print their official certificate.</p>
          <button onClick={handlePrint} className="btn btn-primary" style={{ width: '100%' }}>
            Print Preview
          </button>
        </div>
      </div>

      {/* PRINT LAYOUT: HIGH QUALITY DOUBLE GOLD BORDERED DIPLOMA */}
      <div className="print-only" style={{
        maxWidth: '850px',
        width: '100%',
        margin: '0 auto',
        padding: '50px',
        border: '10px double #d4af37',
        background: '#fff',
        color: '#000',
        fontFamily: "'Times New Roman', Times, serif",
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        
        {/* Background Islamic Watermark Motif */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '400px',
          height: '400px',
          opacity: '0.04',
          pointerEvents: 'none',
          zIndex: '0',
          border: '12px double #000',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          fontWeight: 'bold',
          letterSpacing: '2px',
          textAlign: 'center'
        }}>
          OFFICIAL HIFAZ SEALS
        </div>

        {/* Certificate Frame Content */}
        <div style={{ position: 'relative', zIndex: '1', textAlign: 'center' }}>
          
          {/* Header Bismillah Calligraphy */}
          <div style={{ fontSize: '24px', fontStyle: 'italic', marginBottom: '24px', fontFamily: 'serif' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </div>

          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px', color: '#4a5568', margin: '0 0 6px' }}>Kingdom of Saudi Arabia</h3>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 30px' }}>ARABIC COLLEGE OF RIYADH</h2>

          {/* Certificate Title */}
          <h1 style={{ fontSize: '32px', color: '#aa7c11', margin: '0 0 10px', fontFamily: 'serif', fontWeight: 'bold' }}>
            شهادة حفظ القرآن الكريم
          </h1>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', fontStyle: 'italic', margin: '0 0 40px', color: '#1a202c' }}>
            Certificate of Quran Memorization (Hifz)
          </h2>

          {/* Body */}
          <div style={{ fontSize: '15px', lineHeight: '1.8', color: '#2d3748', maxWidth: '650px', margin: '0 auto 40px', textAlign: 'center' }}>
            This is to certify that student <strong style={{ color: '#000', fontSize: '18px' }}>{student.name}</strong>, 
            bearing Student ID number <strong>{student.student_id_number}</strong>, has successfully completed the memorization of the entire 
            Holy Quran in its entirety, with precise rules of Tajweed and recitation performance.
          </div>

          {/* Arabic Hadith Quote */}
          <div style={{
            fontSize: '18px',
            fontStyle: 'italic',
            fontWeight: 'bold',
            background: '#f7fafc',
            padding: '16px',
            borderLeft: '4px solid #aa7c11',
            borderRadius: '6px',
            maxWidth: '500px',
            margin: '0 auto 50px',
            textAlign: 'center',
            color: '#1a202c'
          }}>
            "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ"
            <div style={{ fontSize: '11px', color: '#718096', marginTop: '6px', fontWeight: 'normal' }}>
              “The best of you are those who learn the Quran and teach it.”
            </div>
          </div>

          {/* Footer seals and dates */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#4a5568' }}>Date of Completion:</div>
              <strong style={{ fontSize: '14px', color: '#000' }}>{completionDate}</strong>
            </div>

            {/* Middle Stamp Icon */}
            <div style={{
              width: '90px',
              height: '90px',
              border: '2px dashed #aa7c11',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#aa7c11',
              transform: 'rotate(-8deg)'
            }}>
              VERIFIED HIFZ
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ width: '150px', borderBottom: '1px solid #4a5568', margin: '0 0 6px auto' }}></div>
              <strong style={{ fontSize: '13px', color: '#000' }}>Dean of Sharia Sciences</strong>
              <div style={{ fontSize: '11px', color: '#718096' }}>Arabic College Academic Board</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default HifzKhatmCertificate;
