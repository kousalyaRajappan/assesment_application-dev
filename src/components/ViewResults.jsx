import React, { useState, useMemo, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/ViewResult.css";

/**
 * ViewResults (list-only)
 * - shows Assessment, Student, Email/ID, Score, Percentage (bar + number), Submitted Date, Graded Date
 * - filters: Assessment, Student (student dropdown updates when assessment selected)
 */

const getAssessmentById = (assessments, id) =>
  assessments.find((a) => a.firebaseId === id) ?? null;

// Format to date only (no time) — change locale if needed ('en-GB' for DD/MM/YYYY)
const formatDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString();
  } catch {
    return "—";
  }
};

const ListView = React.memo(function ListView({ submissions, assessments }) {
  return (
    <div className="vr-list-wrap">
      <table className="vr-list-table" role="table" aria-label="Graded submissions">
        <thead>
          <tr>
            <th className="col-assessment">Assessment</th>
            <th className="col-student">Student</th>
            <th className="col-email">Email / ID</th>
            <th className="col-score">Score</th>
            <th className="col-percent">%</th>
            <th className="col-submitted">Submitted</th>
            <th className="col-graded">Graded</th>
          </tr>
        </thead>

        <tbody>
          {submissions.map((submission) => {
            const assessment = getAssessmentById(assessments, submission.firebaseAssessmentId);
            if (!assessment) return null;

            const totalScore = Number(submission.totalScore ?? 0);
            const maxScore = Number(assessment.maxScore ?? 0) || 0;

            // compute percentage (1 decimal), clamp 0..100
            const rawPct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
            const pctNum = Math.max(0, Math.min(100, rawPct));
            const pctDisplay = pctNum.toFixed(1);

            // color category for styling
            const pctCategory = pctNum >= 80 ? "ok" : pctNum >= 50 ? "warn" : "low";

            const studentDetail = submission.studentEmail ?? submission.studentId ?? "";

            return (
              <tr key={submission.id ?? `${submission.firebaseAssessmentId}-${submission.studentName}`}>
                <td className="col-assessment">{assessment.title}</td>
                <td className="col-student">{submission.studentName}</td>
                <td className="col-email">{studentDetail || "—"}</td>
                <td className="col-score">{totalScore} / {assessment.maxScore}</td>

                <td className="col-percent">
                  <div className="lr-pct-wrap" title={`${pctDisplay}%`}>
                    <div className="lr-pct-track" aria-hidden="true">
                      <div
                        className={`lr-pct-fill ${pctCategory}`}
                        style={{ width: `${pctNum}%` }}
                      />
                    </div>
                    <span className={`lr-pct-text ${pctCategory}`}>{pctDisplay}%</span>
                  </div>
                </td>

                <td className="col-submitted">{formatDate(submission.submittedAt)}</td>
                <td className="col-graded">{formatDate(submission.gradedAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

ListView.propTypes = {
  submissions: PropTypes.array.isRequired,
  assessments: PropTypes.array.isRequired,
};

const ViewResults = ({ assessments = [], extractAllSubmissionsFromAssessments, students = null }) => {
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  const allSubmissions = useMemo(() => {
    return typeof extractAllSubmissionsFromAssessments === "function"
      ? extractAllSubmissionsFromAssessments() || []
      : [];
  }, [extractAllSubmissionsFromAssessments]);

  const assessmentOptions = useMemo(() => {
    return (assessments || [])
      .map((a) => ({ value: a.firebaseId, label: `${a.title} (${a.maxScore ?? "—"} pts)` }))
      .sort((x, y) => x.label.localeCompare(y.label));
  }, [assessments]);

  const studentOptions = useMemo(() => {
    const map = new Map();
    const subs = selectedAssessment
      ? (allSubmissions || []).filter((s) => s && s.firebaseAssessmentId === selectedAssessment)
      : allSubmissions;

    (subs || []).forEach((s) => {
      if (!s) return;
      const id = s.studentId ?? s.studentEmail ?? s.studentName;
      const label = s.studentName ?? s.studentEmail ?? id;
      if (id && !map.has(String(id))) map.set(String(id), { value: id, label });
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [selectedAssessment, allSubmissions]);

  // clear selectedStudent if it's not in the options (e.g. assessment changed)
  useEffect(() => {
    if (selectedStudent && !studentOptions.some((o) => String(o.value) === String(selectedStudent))) {
      setSelectedStudent("");
    }
  }, [studentOptions, selectedStudent]);

  const filteredSubmissions = useMemo(() => {
    const graded = (allSubmissions || []).filter((s) => s && s.graded);
    return graded.filter((s) => {
      if (selectedAssessment && s.firebaseAssessmentId !== selectedAssessment) return false;
      if (selectedStudent) {
        const sid = s.studentId ?? s.studentEmail ?? s.studentName ?? "";
        return String(sid) === String(selectedStudent);
      }
      return true;
    });
  }, [allSubmissions, selectedAssessment, selectedStudent]);

  const resetFilters = useCallback(() => {
    setSelectedAssessment("");
    setSelectedStudent("");
  }, []);

  const resultCount = filteredSubmissions.length;

  return (
    <section className="vr-container">
      <header className="vr-header bottom-align">
        <div className="vr-header-left">
          <h2 className="vr-title">Assessment Results</h2>
          <div className="vr-sub">Showing <strong>{resultCount}</strong> graded {resultCount === 1 ? "submission" : "submissions"}</div>
        </div>

        <div className="vr-controls-row">
          <div className="vr-filter-bar">
            <div className="vr-filter inline">
              {/* <label htmlFor="assessmentFilter" className="vr-label">Assessment</label> */}
              <select id="assessmentFilter" className="vr-select" value={selectedAssessment} onChange={(e) => setSelectedAssessment(e.target.value)}>
                <option value="">All assessments</option>
                {assessmentOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            <div className="vr-filter inline">
              {/* <label htmlFor="studentFilter" className="vr-label">Student</label> */}
              <select id="studentFilter" className="vr-select" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                <option value="">All students</option>
                {studentOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div className="vr-view-toggle">
            <button type="button" className="vr-reset" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </header>

      {resultCount === 0 ? (
        <div className="vr-empty">
          <p>No graded submissions found.</p>
        </div>
      ) : (
        <ListView submissions={filteredSubmissions} assessments={assessments} />
      )}
    </section>
  );
};

ViewResults.propTypes = {
  assessments: PropTypes.array.isRequired,
  extractAllSubmissionsFromAssessments: PropTypes.func.isRequired,
  students: PropTypes.array,
};

export default ViewResults;
