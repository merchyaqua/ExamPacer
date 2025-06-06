// QuestionTimer.jsx
import React, { useState, useEffect, useCallback } from "react";
import { getQuestions } from "./getQuestions";

/* -------------------- Styles -------------------- */
const styles = {
  container: {
    display: "flex",
    padding: "1rem",
    fontFamily: "Arial",
    gap: "1rem",
  },
  sidebar: { flex: 1 },
  viewer: { width: "800px", height: "400px", border: "1px solid #ddd" },
  input: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    marginBottom: "1rem",
    display: "block",
  },
  button: {
    padding: "0.5rem",
    border: "1px solid #ccc",
    borderRadius: 4,
    background: "#fff",
    cursor: "pointer",
  },
  active: { background: "#c6f6d5" },
  paused: { background: "#fed7d7" },
  navRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1rem",
  },
  timer: { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.5rem" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "1rem" },
  th: { border: "1px solid #ccc", padding: "0.5rem", background: "#f7fafc" },
  td: { border: "1px solid #ccc", padding: "0.5rem" },
};

/* -------------------- Child Components -------------------- */
function TotalTimer({ seconds }) {
  const m = Math.floor(seconds / 60);
  const s = (seconds % 60).toString().padStart(2, "0");
  return (
    <div style={styles.timer}>
      <title> ExamPacer </title>
      <center>
        Total Time: {m}:{s}
      </center>
    </div>
  );
}

function CurrentTimer({ current, pause }) {
  const [tick, setTick] = useState(Date.now());
  useEffect(() => {
    if (!current) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [current]);
  if (!current) return null;
  const now = Date.now();
  const effective = pause || now;
  const elapsed = Math.max(
    0,
    effective - current.start - (current.pausedAccum || 0)
  );
  const m = Math.floor(elapsed / 60000);
  const s = Math.floor((elapsed % 60000) / 1000)
    .toString()
    .padStart(2, "0");
  return (
    <div style={{ ...styles.timer, fontSize: "1.5rem" }}>
      Current: {m}:{s}
    </div>
  );
}

function Navigation({ onPrev, onNext, onPause, onEnd, isPaused }) {
  return (
    <div style={styles.navRow}>
      <button onClick={onPrev} style={{ ...styles.button, width: "30%" }}>
        ⬅️Prev
      </button>
      <button onClick={onNext} style={{ ...styles.button, width: "30%" }}>
        Next➡️
      </button>
      {/* <button
        onClick={onPause}
        style={{ ...styles.button, ...(isPaused ? styles.paused : {}) }}
      >
        {isPaused ? "Resume" : "Pause"}
      </button> */}
      <button
        onClick={onEnd}
        style={{ ...styles.button, background: "#feb2b2", width: "30%" }}
      >
        End
      </button>
    </div>
  );
}

function QuestionGrid({ grouped, currentId, onSelect, logs, current, pause }) {
  return (
    <div>
      {Object.entries(grouped).map(([base, parts]) => (
        <div
          key={base}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "0.5rem",
          }}
        >
          {parts.map((q) => {
            const pastMs = logs
              .filter((l) => l.id === q.id)
              .reduce((sum, l) => sum + parseFloat(l.duration) * 60000, 0);
            const effective =
              pause && current?.id === q.id ? pause : Date.now();
            const liveMs =
              current?.id === q.id
                ? Math.max(
                    0,
                    effective - current.start - (current.pausedAccum || 0)
                  )
                : 0;
            const totalMs = pastMs + liveMs;
            const m = Math.floor(totalMs / 60000);
            const s = Math.floor((totalMs % 60000) / 1000)
              .toString()
              .padStart(2, "0");
            return (
              <button
                key={q.id}
                onClick={() => onSelect(q)}
                style={{
                  ...styles.button,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  ...(currentId === q.id ? styles.active : {}),
                }}
              >
                <span>
                  {q.id} ({q.marks}m)
                </span>
                <span
                  style={{ fontSize: "0.8rem", color: "#666", marginTop: 2 }}
                >
                  {m}:{s}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function LogsTable({ logs, questions }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Q</th>
          <th style={styles.th}>Start</th>
          <th style={styles.th}>End</th>
          <th style={styles.th}>Dur</th>
          <th style={styles.th}>m/m</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((l, i) => {
          const m = questions.find((q) => q.id === l.id)?.marks || 1;
          return (
            <tr key={i}>
              <td style={styles.td}>{l.id}</td>
              <td style={styles.td}>
                {new Date(l.start).toLocaleTimeString()}
              </td>
              <td style={styles.td}>{new Date(l.end).toLocaleTimeString()}</td>
              <td style={styles.td}>{l.duration}</td>
              <td style={styles.td}>
                {(parseFloat(l.duration) / m).toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SummaryTable({ summary, avgPPM, totalMinutes, examMinutes }) {
  return (
    <div>
      <div style={{ marginBottom: "0.5rem" }}>
        <strong>Avg m/m:</strong> {avgPPM} | <strong>Total:</strong>{" "}
        {totalMinutes}min / {examMinutes}min
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Q</th>
            <th style={styles.th}>TotDur</th>
            <th style={styles.th}>Marks</th>
            <th style={styles.th}>m/m</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((s, i) => (
            <tr key={i}>
              <td style={styles.td}>{s.id}</td>
              <td style={styles.td}>{s.total}</td>
              <td style={styles.td}>{s.marks}</td>
              <td style={styles.td}>{s.ppm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QuestionTimer() {
  const [questions, setQuestions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [pause, setPause] = useState(false);
  const [view, setView] = useState("logs");
  const [totalSec, setTotalSec] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [viewPdf, setViewPdf] = useState(true);
  const [examMin, setExamMin] = useState(75);

  // total timer tick
  useEffect(() => {
    const id = setInterval(() => {
      if (!pause && current) {
        setTotalSec((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [pause, current]);

  const commitCurrent = (end) => {
    if (!current) return;
    const eff = current.start + (current.pausedAccum || 0);
    const dur = ((end - eff) / 60000).toFixed(2);
    setLogs((p) => [...p, { id: current.id, start: eff, end, duration: dur }]);
  };

  const select = useCallback(
    (q) => {
      const t = Date.now();
      if (current && current.id !== q.id) commitCurrent(t);
      if (!current) setTotalSec(0);
      setPause(false);
      setCurrent({ id: q.id, start: t, pausedAccum: 0 });
    },
    [current]
  );

  const prev = useCallback(() => {
    if (!questions.length) return;
    const idx = current ? questions.findIndex((q) => q.id === current.id) : 0;
    select(questions[Math.max(0, idx - 1)]);
  }, [current, questions, select]);

  const next = useCallback(() => {
    if (!questions.length) return;
    const idx = current ? questions.findIndex((q) => q.id === current.id) : -1;
    select(questions[Math.min(questions.length - 1, idx + 1)]);
  }, [current, questions, select]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") prev();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next]);

  const togglePause = () => {
    if (!current) return;
    setPause((p) => !p);
  };
  const endSession = () => {
    if (!current) return;
    const t = Date.now();
    commitCurrent(t);
    setCurrent(null);
    setPause(false);
    setView("summary");
  };
  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setPdfUrl(URL.createObjectURL(f));
    setLoading(true);
    const r = await getQuestions(f);
    setLoading(false);
    setQuestions(r.questions);
    setExamMin(r.duration);
  };

  const grouped = {};
  questions.forEach((q) => {
    let b = "";
    if (q.id.includes("(")) {
      b = q.id.split("(")[0];
    } else if (q.id.includes(" ")) {
      b = q.id.split(" ")[0];
    }
    (grouped[b] ||= []).push(q);
  });

  const summary = Object.entries(
    logs.reduce((a, l) => {
      a[l.id] = (a[l.id] || 0) + parseFloat(l.duration);
      return a;
    }, {})
  ).map(([id, t]) => {
    const m = questions.find((q) => q.id === id)?.marks || 1;
    return { id, total: t.toFixed(2), marks: m, ppm: (t / m).toFixed(2) };
  });
  const totMin = summary
    .reduce((s, x) => s + parseFloat(x.total), 0)
    .toFixed(2);
  const totMarks = summary.reduce((s, x) => s + x.marks, 0) || 1;
  const avgPPM = (totMin / totMarks).toFixed(2);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <center>
          <h1>ExamPacer Question Timer</h1>
        </center>

        <label for="questionPaper">Upload a PDF of questions:</label>
        <input
          id="questionPaper"
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          style={styles.input}
        />
        {pdfUrl && (
          <button style={styles.button} onClick={() => setViewPdf(!viewPdf)}>
            {" "}
            Toggle PDF view{" "}
          </button>
        )}

        <TotalTimer seconds={totalSec} />
        {/* <CurrentTimer current={current} pause={pause} /> */}
        <Navigation
          onPrev={prev}
          onNext={next}
          onPause={togglePause}
          onEnd={endSession}
          isPaused={pause}
        />
        {loading ? (
          "Loading... usually a second per page. "
        ) : (
          <QuestionGrid
            grouped={grouped}
            currentId={current?.id}
            onSelect={select}
            logs={logs}
            current={current}
            pause={pause}
          />
        )}
        {logs.length > 0 && (
          <>
            <div style={styles.navRow}>
              <button style={styles.button} onClick={() => setView("logs")}>
                Logs
              </button>
              <button style={styles.button} onClick={() => setView("summary")}>
                Summary
              </button>
            </div>
            {view === "logs" ? (
              <LogsTable logs={logs} questions={questions} />
            ) : (
              <SummaryTable
                summary={summary}
                avgPPM={avgPPM}
                totalMinutes={totMin}
                examMinutes={examMin}
              />
            )}
          </>
        )}
      </div>
      {pdfUrl && viewPdf && (
        <div style={styles.viewer}>
          <iframe
            title="PDF"
            view="FitH"
            src={pdfUrl + "#toolbar=1"}
            width="100%"
            height="1000px"
          />
        </div>
      )}
    </div>
  );
}
