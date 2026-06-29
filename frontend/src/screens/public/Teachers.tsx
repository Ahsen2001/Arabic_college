import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Mail, GraduationCap, Award, Landmark } from 'lucide-react';

interface Teacher {
  id: number;
  name: string;
  email: string;
  department: string;
  specialization: string;
  designation: string;
}

const Teachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await api.get('/public/teachers');
        setTeachers(response.data.data);
      } catch (error) {
        console.error("Failed to fetch public teachers. Using static defaults.", error);
        setTeachers([
          {
            id: 1,
            name: 'Sheikh Dr. Bilal Al-Madani',
            email: 'b.madani@arabiccollege.edu',
            department: 'Department of Islamic Law (Sharia)',
            specialization: 'Comparative Fiqh & Sharia Rulings',
            designation: 'Professor',
          },
          {
            id: 2,
            name: 'Dr. Tariq Al-Hashimi',
            email: 't.hashimi@arabiccollege.edu',
            department: 'Department of Arabic Language and Literature',
            specialization: 'Arabic Morphology (Sarf)',
            designation: 'Associate Professor',
          },
          {
            id: 3,
            name: 'Sheikh Dr. Abdul Qadir Al-Jailani',
            email: 'qadir@arabiccollege.edu',
            department: 'Department of Hadith Sciences',
            specialization: 'Hadith Criticism & Narrators analysis',
            designation: 'Professor',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeachers();
  }, []);

  return (
    <div className="public-subpage teachers-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Faculty & Scholars</h1>
          <p>Learn from internationally recognized scholars holding authentic academic lineages</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {loading ? (
            <div className="spinner-center">
              <div className="spinner"></div>
              <p>Loading faculty directory...</p>
            </div>
          ) : (
            <div className="teachers-grid">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="teacher-card">
                  <div className="teacher-avatar-placeholder">
                    <GraduationCap className="avatar-icon" />
                  </div>
                  <div className="teacher-card-body">
                    <h3>{teacher.name}</h3>
                    <span className="teacher-designation-badge">
                      <Award size={13} /> {teacher.designation}
                    </span>
                    
                    <div className="teacher-meta-items">
                      <div className="meta-item">
                        <Landmark size={14} className="meta-icon" />
                        <span>{teacher.department}</span>
                      </div>
                      <div className="meta-item">
                        <GraduationCap size={14} className="meta-icon" />
                        <span>Specialization: <strong>{teacher.specialization}</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="teacher-card-footer">
                    <a href={`mailto:${teacher.email}`} className="btn-link flex-center">
                      <Mail size={14} style={{ marginRight: '6px' }} /> Contact Professor
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Teachers;
