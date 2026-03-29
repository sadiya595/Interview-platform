import { useState } from "react"
import axios from "axios"
const API_URL = ""


export default function App() {
  const [screen, setScreen] = useState("home")
  const [role, setRole] = useState("Software Engineer")
  const [level, setLevel] = useState("Junior")
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [answer, setAnswer] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  async function startInterview() {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/generate-questions`, { role, level })
      setQuestions(res.data.questions)
      setCurrent(0)
      setResults([])
      setScreen("interview")
    } catch (e) {
      alert("Failed to generate questions. Make sure backend is running.")
    }
    setLoading(false)
  }

  async function submitAnswer() {
    setLoading(true)
    try {
      const res = await axios.post(`${API}/evaluate-answer`, {
        question: questions[current].question,
        answer,
        role,
        level
      })
      const newResults = [...results, {
        question: questions[current],
        answer,
        evaluation: res.data
      }]
      setResults(newResults)
      setEvaluation(res.data)

      if (current + 1 >= questions.length) {
        setScreen("results")
      } else {
        setScreen("feedback")
      }
    } catch (e) {
      alert("Failed to evaluate answer.")
    }
    setLoading(false)
  }

  function nextQuestion() {
    setCurrent(current + 1)
    setAnswer("")
    setEvaluation(null)
    setScreen("interview")
  }

  function restart() {
    setScreen("home")
    setResults([])
    setCurrent(0)
    setAnswer("")
  }

  const avgScore = results.length
    ? Math.round(results.reduce((a, r) => a + r.evaluation.score, 0) / results.length)
    : 0

  if (screen === "home") return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">AI Mock Interview</h1>
          <p className="text-gray-400">Practice interviews with real AI feedback</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Job Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none"
            >
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Product Manager</option>
              <option>DevOps Engineer</option>
              <option>Machine Learning Engineer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Experience Level</label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none"
            >
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
            </select>
          </div>
          <button
            onClick={startInterview}
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Generating questions..." : "Start Interview →"}
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === "interview") return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <span className="text-gray-400 text-sm">{role} · {level}</span>
          <span className="text-gray-400 text-sm">Question {current + 1} of {questions.length}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8">
          <div
            className="bg-violet-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <div className="flex gap-2 mb-4">
            <span className="bg-violet-900 text-violet-300 text-xs px-3 py-1 rounded-full">
              {questions[current]?.category}
            </span>
            <span className="bg-gray-800 text-gray-400 text-xs px-3 py-1 rounded-full">
              {questions[current]?.difficulty}
            </span>
          </div>
          <p className="text-lg font-medium">{questions[current]?.question}</p>
        </div>
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          rows={6}
          className="w-full bg-gray-900 text-white rounded-2xl p-4 outline-none resize-none mb-4 placeholder-gray-600"
        />
        <button
          onClick={submitAnswer}
          disabled={loading || !answer.trim()}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition"
        >
          {loading ? "Evaluating..." : "Submit Answer →"}
        </button>
      </div>
    </div>
  )

  if (screen === "feedback") return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Feedback</h2>
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400 text-sm">Your score</span>
            <span className={`text-3xl font-bold ${evaluation?.score >= 7 ? "text-green-400" : evaluation?.score >= 5 ? "text-yellow-400" : "text-red-400"}`}>
              {evaluation?.score}/10
            </span>
          </div>
          <span className={`text-sm px-3 py-1 rounded-full ${evaluation?.verdict === "Strong" ? "bg-green-900 text-green-300" : evaluation?.verdict === "Acceptable" ? "bg-yellow-900 text-yellow-300" : "bg-red-900 text-red-300"}`}>
            {evaluation?.verdict}
          </span>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <h3 className="text-green-400 font-semibold mb-3">Strengths</h3>
          <ul className="space-y-2">
            {evaluation?.strengths?.map((s, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-green-400">✓</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 mb-4">
          <h3 className="text-amber-400 font-semibold mb-3">Areas to improve</h3>
          <ul className="space-y-2">
            {evaluation?.improvements?.map((s, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-amber-400">→</span>{s}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <h3 className="text-violet-400 font-semibold mb-3">Model answer</h3>
          <p className="text-gray-300 text-sm leading-relaxed">{evaluation?.model_answer}</p>
        </div>
        <button
          onClick={nextQuestion}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition"
        >
          Next Question →
        </button>
      </div>
    </div>
  )

  if (screen === "results") return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Interview Complete</h2>
          <p className="text-gray-400">{role} · {level}</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8 text-center mb-6">
          <p className="text-gray-400 text-sm mb-2">Overall Score</p>
          <p className={`text-6xl font-bold mb-2 ${avgScore >= 7 ? "text-green-400" : avgScore >= 5 ? "text-yellow-400" : "text-red-400"}`}>
            {avgScore}<span className="text-2xl text-gray-600">/10</span>
          </p>
          <p className="text-gray-400 text-sm">{questions.length} questions answered</p>
        </div>
        <div className="space-y-3 mb-6">
          {results.map((r, i) => (
            <div key={i} className="bg-gray-900 rounded-xl p-4 flex justify-between items-center">
              <p className="text-sm text-gray-300 flex-1 mr-4 truncate">{r.question.question}</p>
              <span className={`text-sm font-bold ${r.evaluation.score >= 7 ? "text-green-400" : r.evaluation.score >= 5 ? "text-yellow-400" : "text-red-400"}`}>
                {r.evaluation.score}/10
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={restart}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg transition"
        >
          Start New Interview
        </button>
      </div>
    </div>
  )
}