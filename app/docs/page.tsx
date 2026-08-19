"use client";
import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Student API",
    description:
      "API endpoints for the Student. These endpoints may be rate limited, and misuse will lead in these being removed.",
  },
  servers: [],
  components: {
    schemas: {
      Credentials: {
        type: "object",
        required: ["district_url", "username", "password"],
        properties: {
          district_url: {
            type: "string",
            description: "The Synergy district URL",
            example: "wa-nor-psv.edupoint.com",
          },
          username: {
            type: "string",
            description: "Student username",
          },
          password: {
            type: "string",
            description: "Student password",
          },
        },
      },
      Error: {
        type: "object",
        properties: {
          error: {
            type: "string",
            description:
              "Error message. This will always include a error code with the error in the string.",
          },
        },
      },
    },
  },
  paths: {
    "/api/synergy/gradebook": {
      post: {
        summary: "Get gradebook data",
        description:
          "Fetches the student's gradebook including courses, marks, and assignments",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/Credentials" },
                  {
                    type: "object",
                    properties: {
                      reportPeriod: {
                        type: "integer",
                        description: "Optional reporting period index",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Gradebook data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  description: "Gradebook object with courses and assignments",
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/student": {
      post: {
        summary: "Get student info",
        description:
          "Fetches the student profile (Synergy GetStudentInfoData). Districts populate these fields inconsistently \u2014 anything the district leaves blank comes back as an empty string.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Student information",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permID: { type: "string" },
                    formattedName: { type: "string" },
                    currentSchool: { type: "string" },
                    grade: { type: "string" },
                    gender: { type: "string" },
                    birthDate: { type: "string" },
                    address: { type: "string" },
                    phone: { type: "string" },
                    eMail: { type: "string" },
                    nickName: { type: "string" },
                    lastNameGoesBy: { type: "string" },
                    homeLanguage: { type: "string" },
                    track: { type: "string" },
                    homeRoom: { type: "string" },
                    homeRoomTch: { type: "string" },
                    homeRoomTchEMail: { type: "string" },
                    homeRoomTchStaffGU: { type: "string" },
                    counselorName: { type: "string" },
                    counselorEmail: { type: "string" },
                    counselorStaffGU: { type: "string" },
                    orgYearGU: { type: "string" },
                    photo: {
                      type: "string",
                      description: "base64 encoded photo",
                    },
                    physician: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        hospital: { type: "string" },
                        phone: { type: "string" },
                        extn: { type: "string" },
                      },
                    },
                    dentist: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        office: { type: "string" },
                        phone: { type: "string" },
                        extn: { type: "string" },
                      },
                    },
                    emergencyContacts: {
                      type: "array",
                      items: { type: "object" },
                    },
                    lockerInfoRecords: {
                      type: "array",
                      items: { type: "object" },
                    },
                    studentBusAssignments: {
                      type: "array",
                      items: { type: "object" },
                    },
                    userDefinedGroupBoxes: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/schedule": {
      post: {
        summary: "Get class schedule",
        description: "Get class schedule and today's classes.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Schedule data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/attendance": {
      post: {
        summary: "Get attendance records",
        description:
          "Fetches attendance data for the student, some schools may not use this feature.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Attendance data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/calendar": {
      post: {
        summary: "Get school calendar",
        description: "Fetches school calendar events",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Calendar data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/messages": {
      post: {
        summary: "Get messages",
        description:
          "Fetches PXP messages and announcements. This does not include Synergy Mail.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Messages data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/mail": {
      post: {
        summary: "Get Synergy mail",
        description:
          "Fetches Synergy mail messages, some schools may not use this feature.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Mail data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/tests": {
      post: {
        summary: "Get test history",
        description:
          "Fetches school test history, some schools may not use this feature.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Test history data" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/documents": {
      post: {
        summary: "Get documents list",
        description: "Fetches list of available documents",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Documents list" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/documents/get": {
      post: {
        summary: "Get document content",
        description: "Fetches a specific document's content",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/Credentials" },
                  {
                    type: "object",
                    required: ["documentGU"],
                    properties: {
                      documentGU: {
                        type: "string",
                        description: "Document GUID",
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          "200": { description: "Document content" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/reportcard": {
      post: {
        summary: "Get report cards list",
        description: "Fetches list of available report cards",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "Report cards list" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/school/info": {
      post: {
        summary: "Get school information",
        description: "Gets school content info and staff information",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": { description: "School information" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/student/details": {
      post: {
        summary: "Get student info from the portal page",
        description:
          "Scrapes PXP2_Student.aspx, the portal's own Student Info page. Districts populate it far more fully than the mobile API \u2014 homeroom teacher, counselor, legal names and grad year typically appear here even when /api/synergy/student returns them blank.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Sections as rendered on the portal page",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    meta: {
                      type: "object",
                      description:
                        "details from the page chrome and PXP.NavigationData rather than the info tables",
                      properties: {
                        district: { type: "string" },
                        fullName: { type: "string" },
                        studentId: { type: "string" },
                        school: { type: "string" },
                        schoolPhone: { type: "string" },
                        photoPath: { type: "string" },
                        namePronunciationPath: {
                          type: "string",
                          description:
                            "portal path to an audio clip; fetch via /api/synergy/student/asset",
                        },
                        modules: { type: "array", items: { type: "string" } },
                      },
                    },
                    sections: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: {
                            type: "string",
                            description: 'e.g. "Student School Info"',
                          },
                          fields: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                label: { type: "string" },
                                value: { type: "string" },
                              },
                            },
                          },
                          table: {
                            type: "object",
                            description:
                              "present instead of fields for grid sections such as phone numbers",
                            properties: {
                              headers: {
                                type: "array",
                                items: { type: "string" },
                              },
                              rows: {
                                type: "array",
                                items: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/student/asset": {
      post: {
        summary: "Fetch portal-hosted media",
        description:
          "Streams a file from the district's Photos/ tree (currently the name pronunciation clip returned in /api/synergy/student/details meta). Requires the Synergy session cookie, so the browser cannot request it directly. Takes a `path` alongside the credentials and responds with the raw bytes.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/Credentials" },
                  {
                    type: "object",
                    properties: {
                      path: {
                        type: "string",
                        example: "Photos/CC/GUID_NamePronunciation.MP3",
                      },
                    },
                    required: ["path"],
                  },
                ],
              },
            },
          },
        },
        responses: {
          "200": {
            description: "File contents",
            content: {
              "*/*": { schema: { type: "string", format: "binary" } },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/student/name": {
      post: {
        summary: "Get student name",
        description:
          "Fetches the student's display name, sometimes this is included in /api/synergy/student and this is not needed.",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Credentials" },
            },
          },
        },
        responses: {
          "200": {
            description: "Student name",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/synergy/districts": {
      post: {
        summary: "Search districts",
        description: "Search for Synergy districts by zip code",
        tags: ["Synergy"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["zip"],
                properties: {
                  zip: {
                    type: "string",
                    description: "Zip code to search",
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "List of districts" },
          "400": {
            description: "Bad request",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
  },
};

export default function Swagger() {
  return (
    <div className="min-h-screen bg-white">
      <SwaggerUI spec={spec} />
    </div>
  );
}
