// this page is more of a dev-page to get student info for testing purposes
// ¯\_(ツ)_/¯
"use client";

import React, { useEffect, useState } from "react";

interface StudentInfo {
  [key: string]: unknown;
}

export default function StudentInfoPage() {
  const [info, setInfo] = useState<StudentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("https://studentvue.aram.sh/student_info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "2028163",
            password: "Nan0Zer0Coc0",
            district_url: "https://wa-nor-psv.edupoint.com",
          }),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setInfo(data.data.StudentInfo);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch student info");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInfo();
  }, []);

  if (isLoading) return <div className="p-8">Loading student info...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!info) return <div className="p-8">No student info found.</div>;

  const renderField = (label: string, value: unknown): React.ReactNode => {
    if (
      value == null ||
      value === "" ||
      typeof value === "object" ||
      (typeof value === "string" && value.trim() === "[object Object]")
    ) {
      return null;
    }
    return (
      <div className="mb-2">
        <span className="font-semibold">{label}:</span> {String(value)}
      </div>
    );
  };

  let physicianName = "";
  let physicianPhone = "";
  let dentistName = "";
  let dentistPhone = "";
  if (info.Physician && typeof info.Physician === "object") {
    physicianName = String((info.Physician as { [key: string]: unknown })["@Name"] ?? "");
    physicianPhone = String((info.Physician as { [key: string]: unknown })["@Phone"] ?? "");
  }
  if (info.Dentist && typeof info.Dentist === "object") {
    dentistName = String((info.Dentist as { [key: string]: unknown })["@Name"] ?? "");
    dentistPhone = String((info.Dentist as { [key: string]: unknown })["@Phone"] ?? "");
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white rounded shadow mt-8">
      <h1 className="text-2xl font-bold mb-4">Student Info</h1>
      {renderField("Name", typeof info.FormattedName === "object" && info.FormattedName !== null && "$" in info.FormattedName ? String((info.FormattedName as { $: string })["$"]) : String(info.FormattedName ?? ""))}
      {renderField("Nickname", String(info.NickName ?? ""))}
      {renderField("Birth Date", String(info.BirthDate ?? ""))}
      {renderField("Gender", String(info.Gender ?? ""))}
      {renderField("Grade", String(info.Grade ?? ""))}
      {(() => {
        let school = "";
        if (typeof info.CurrentSchool === "object" && info.CurrentSchool !== null && "$" in info.CurrentSchool) {
          school = String((info.CurrentSchool as { $: string })["$"]);
        } else {
          school = String(info.CurrentSchool ?? "");
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("studentSchool", school);
        }
        return renderField("Current School", school);
      })()}
      {renderField("Counselor Name", String(info.CounselorName ?? ""))}
      {renderField("Counselor Email", String(info.CounselorEmail ?? ""))}
      {renderField("Home Language", String(info.HomeLanguage ?? ""))}
      {renderField("Home Room", String(info.HomeRoom ?? ""))}
      {renderField("Home Room Teacher", String(info.HomeRoomTch ?? ""))}
      {renderField("Home Room Teacher Email", String(info.HomeRoomTchEMail ?? ""))}
      {renderField("Phone", String(info.Phone ?? ""))}
      {renderField("Email", String(info.EMail ?? ""))}
      {renderField("Address", String(info.Address ?? ""))}
      {renderField("Track", String(info.Track ?? ""))}
      {(() => {
        let permId = "";
        if (typeof info.PermID === "object" && info.PermID !== null && "$" in info.PermID) {
          permId = String((info.PermID as { $: string })["$"]);
        } else {
          permId = String(info.PermID ?? "");
        }
        if (typeof window !== "undefined") {
          localStorage.setItem("studentPermId", permId);
        }
        return renderField("Perm ID", permId);
      })()}
      {renderField("Org Year GU", typeof info.OrgYearGU === "object" && info.OrgYearGU !== null && "$" in info.OrgYearGU ? String((info.OrgYearGU as { $: string })["$"]) : String(info.OrgYearGU ?? ""))}
      {renderField("Locker Info", String(info.LockerInfoRecords ?? ""))}
      {renderField("Bus Assignments", String(info.StudentBusAssignments ?? ""))}
      {physicianName && renderField("Physician Name", physicianName)}
      {physicianPhone && renderField("Physician Phone", physicianPhone)}
      {dentistName && renderField("Dentist Name", dentistName)}
      {dentistPhone && renderField("Dentist Phone", dentistPhone)}
      {(() => {
        let photoBase64 = "";
        if (info.Photo && typeof info.Photo === "object" && "$" in info.Photo) {
          photoBase64 = String((info.Photo as { $: unknown })["$"] ?? "");
          if (typeof window !== "undefined") {
            localStorage.setItem("studentPhoto", photoBase64);
          }
        }
        return photoBase64 ? (
          <div className="mt-4">
            <span className="font-semibold">Photo:</span>
            <br />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${photoBase64}`}
              alt="Student Photo"
              className="mt-2 rounded shadow w-48 h-auto"
            />
          </div>
        ) : null;
      })()}
    </div>
  );
}
