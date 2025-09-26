"use client";

import { useEffect, useState } from "react";


interface Term {
  termIndex: number;
  termName: string;
  beginDate: string;
  endDate: string;
}

interface ClassListing {
  "@CourseTitle": string;
  "@Period": number | string;
  "@RoomName": string;
  "@Teacher": string;
  "@TeacherEmail"?: string;
  [key: string]: any;
}

export default function SchedulePage() {
  const [classes, setClasses] = useState<ClassListing[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const creds = localStorage.getItem("studentvue-creds");
    if (!creds) {
      window.location.href = "/";
      return;
    }
    fetch(`https://${process.env.NEXT_PUBLIC_APIVUE_SERVER_URL}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...JSON.parse(creds), term_index: selectedTerm }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const sched = data.data.StudentClassSchedule;
        const classList = sched.ClassLists?.ClassListing || [];
        setClasses(Array.isArray(classList) ? classList : [classList]);
        const termList = sched.TermLists?.TermListing || [];
        setTerms(
          (Array.isArray(termList) ? termList : [termList]).map((t: any) => ({
            termIndex: Number(t["@TermIndex"]),
            termName: t["@TermName"],
            beginDate: t["@BeginDate"],
            endDate: t["@EndDate"],
          }))
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [selectedTerm]);

  if (isLoading) return <div className="p-8">Loading schedule...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!classes.length) return <div className="p-8">No schedule found.</div>;

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Class Schedule</h1>
      {terms.length > 1 && (
        <div className="mb-4">
          <label className="font-semibold mr-2">Term:</label>
          <select
            value={selectedTerm}
            onChange={e => setSelectedTerm(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {terms.map(term => (
              <option key={term.termIndex} value={term.termIndex}>
                {term.termName} ({term.beginDate} - {term.endDate})
              </option>
            ))}
          </select>
        </div>
      )}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Period</th>
            <th className="p-2 border">Course</th>
            <th className="p-2 border">Room</th>
            <th className="p-2 border">Teacher</th>
            <th className="p-2 border">Teacher Email</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((course, i) => (
            <tr key={i} className="even:bg-gray-50">
              <td className="p-2 border">{course["@Period"]}</td>
              <td className="p-2 border">{course["@CourseTitle"]}</td>
              <td className="p-2 border">{course["@RoomName"]}</td>
              <td className="p-2 border">{course["@Teacher"]}</td>
              <td className="p-2 border">{course["@TeacherEmail"] || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
