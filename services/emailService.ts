
import { GoogleGenAI } from "@google/genai";
import { LeaveRequest, LeaveStatus, UserRole } from "../types";

const ai = new GoogleGenAI({
  apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY || ""
});

export type EmailNotificationType =
  | 'APPLIED'
  | 'PENDING_SUBADMIN'
  | 'PENDING_SUPERADMIN'
  | 'FULLY_APPROVED'
  | 'REJECTED';

export const generateEmailContent = async (type: EmailNotificationType, request: LeaveRequest) => {
  console.log(`[Email Service] Generating ${type} content for request ${request.id}...`);
  if (!(import.meta as any).env.VITE_GEMINI_API_KEY && !(import.meta as any).env.GEMINI_API_KEY) {
    console.warn("[Email Service] No Gemini API Key found! Using fallback content.");
  }

  let prompt = "";
  let subject = "";

  switch (type) {
    case 'APPLIED':
      subject = `New Leave Request: ${request.studentName}`;
      prompt = `Write a professional email body for an Admin. Student ${request.studentName} (${request.studentEmail}) has applied for leave.
      Dates: ${request.startDate} to ${request.endDate} (${request.totalDays} days).
      Reason: ${request.reason}.
      Request ID: ${request.id}.
      Ask them to review it in the Admin Dashboard.`;
      break;

    case 'PENDING_SUBADMIN':
      subject = `Leave Request Approval Needed: ${request.studentName}`;
      prompt = `Write a professional email body for a Sub-Admin. A leave request for ${request.studentName} has been approved by the Admin and now requires your review.
      Dates: ${request.startDate} to ${request.endDate}.
      Reason: ${request.reason}.
      Request ID: ${request.id}.`;
      break;

    case 'PENDING_SUPERADMIN':
      subject = `Final Review Required: ${request.studentName}`;
      prompt = `Write a professional email body for the Super-Admin. A leave request for ${request.studentName} has passed Admin and Sub-Admin reviews and now requires your FINAL approval.
      Dates: ${request.startDate} to ${request.endDate}.
      Reason: ${request.reason}.
      Request ID: ${request.id}.`;
      break;

    case 'FULLY_APPROVED':
      subject = `Leave Request Fully APPROVED ✓`;
      prompt = `Write a joyful and professional congratulatory email body for student ${request.studentName}. Their leave request ${request.id} has been fully approved by all administration levels.
      Final Approved Dates: ${request.startDate} to ${request.endDate}.
      Expected Return: ${request.expectedReturnDate}.
      Remind them to travel safely.`;
      break;

    case 'REJECTED':
      subject = `Leave Request REJECTED ✗`;
      prompt = `Write a serious but professional email body for student ${request.studentName} regarding their leave request ${request.id}.
      Status: REJECTED.
      Rejected by: ${request.rejectedByRole} (${request.rejectedByEmail}).
      Reason for denial: "${request.rejectionReason}".
      Advise them to contact the administration office if they have further questions.`;
      break;
  }

  try {
    // gemini-1.5-flash is the recommended model for this SDK
    const modelName = 'gemini-1.5-flash';

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    console.log("[Email Service] Gemini Raw Response:", response);

    // Some versions of the GenAI SDK return text directly, others nested
    let text = "";
    if (response && (response as any).text) {
      text = (response as any).text;
    } else if (response && (response as any).candidates?.[0]?.content?.parts?.[0]?.text) {
      text = (response as any).candidates[0].content.parts[0].text;
    } else if (response && (response as any).response?.text) {
      text = (response as any).response.text();
    }

    if (!text) {
      console.warn("[Email Service] Gemini returned empty text. Response structure:", JSON.stringify(response));
      throw new Error("Empty response from Gemini");
    }

    return { subject, body: text };
  } catch (error) {
    console.error("Gemini content generation failed:", error);
    // Fallback content if AI fails
    return {
      subject,
      body: `This is an automated notification regarding leave request ${request.id} for ${request.studentName}. Status changed to: ${type}.`
    };
  }
};
