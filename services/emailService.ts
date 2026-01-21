
import { GoogleGenAI } from "@google/genai";
import { LeaveRequest, LeaveStatus, User } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const sendEmailNotification = async (type: 'APPLIED' | 'APPROVED' | 'REJECTED', request: LeaveRequest, recipient: string) => {
  console.log(`[Email Service] Preparing ${type} notification for ${recipient}...`);
  
  let prompt = "";
  if (type === 'APPLIED') {
    prompt = `Write a professional email notification to an Admin informing them that student ${request.studentName} has applied for leave from ${request.startDate} to ${request.endDate} for reason: ${request.reason}. Include reference ID: ${request.id}`;
  } else if (type === 'APPROVED') {
    prompt = `Write a professional email notification to student ${request.studentName} congratulating them that their leave request ${request.id} has been fully APPROVED. Remind them to return by ${request.expectedReturnDate}.`;
  } else if (type === 'REJECTED') {
    prompt = `Write a professional but serious email notification to student ${request.studentName} informing them their leave request (${request.id}) from ${request.startDate} to ${request.endDate} was REJECTED. 
    Denied by: ${request.rejectedByRole} (${request.rejectedByEmail}).
    Reason for denial: "${request.rejectionReason}".
    Include instructions to contact the administration if they have questions.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    
    console.log("-----------------------------------------");
    console.log(`To: ${recipient}`);
    console.log(`Subject: Navgurukul Rejection Alert - Request #${request.id}`);
    console.log("Body:", response.text);
    console.log("-----------------------------------------");
    return true;
  } catch (error) {
    console.error("Email simulation failed:", error);
    return false;
  }
};
