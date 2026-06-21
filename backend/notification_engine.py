import os
import smtplib
from email.message import EmailMessage
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client
from groq import Groq

load_dotenv()

app = FastAPI(title="LocalPulse AI Notification Engine")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

class NotifyRequest(BaseModel):
    issue_id: str

def generate_ai_insight(title: str, description: str, category: str, severity: str) -> str:
    if not groq_client:
        return "Stay alert and stay safe."
    
    prompt = f"""
    You are LocalPulse AI, a civic intelligence system.
    A new {severity} severity issue has been reported in the {category} category.
    Title: {title}
    Description: {description}
    
    Write a brief, 2-sentence actionable insight or safety tip for citizens in the area regarding this specific issue. Keep it professional and helpful.
    """
    try:
        completion = groq_client.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=100,
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Stay alert and report any updates via the LocalPulse app."

def send_email_alert(recipient: str, subject: str, html_content: str):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"LocalPulse AI <{SMTP_USER}>"
    msg['To'] = recipient
    msg.set_content("Please enable HTML to view this message.")
    msg.add_alternative(html_content, subtype='html')

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        print(f"Email sent successfully to {recipient}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise e

@app.post("/notify")
async def trigger_notification(req: NotifyRequest):
    # Fetch issue details
    response = supabase.table("issues").select("*").eq("id", req.issue_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    issue = response.data[0]
    
    # Generate Insight
    insight = generate_ai_insight(
        title=issue.get("title", ""),
        description=issue.get("description", ""),
        category=issue.get("category", ""),
        severity=issue.get("severity", "")
    )
    
    severity_color = "#FF0000" if issue.get("severity") in ['high', 'critical'] else "#FF9800"
    
    # Construct Email HTML
    html_content = f"""
    <html>
    <body style="font-family: Arial, sans-serif; background-color: #0B1120; color: #FFFFFF; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111827; padding: 30px; border-radius: 12px; border: 1px solid #22C55E;">
            <h2 style="color: #22C55E; margin-top: 0;">🚨 LocalPulse Alert</h2>
            <p style="font-size: 16px; color: #A0A0A0;">A new civic issue has been reported in your area.</p>
            
            <div style="background-color: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #FFFFFF;">{issue.get("title")}</h3>
                <p style="color: #A0A0A0;">{issue.get("description")}</p>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <span style="background-color: rgba(34,197,94,0.1); color: #22C55E; padding: 5px 10px; border-radius: 15px; font-size: 12px;">{issue.get("category").upper()}</span>
                    <span style="background-color: {severity_color}20; color: {severity_color}; padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold;">{issue.get("severity").upper()}</span>
                </div>
            </div>
            
            <h3 style="color: #22C55E;">🤖 AI Civic Insight</h3>
            <p style="font-style: italic; color: #A0A0A0; border-left: 3px solid #22C55E; padding-left: 10px;">"{insight}"</p>
            
            <hr style="border-color: rgba(255,255,255,0.1); margin: 30px 0;" />
            <p style="font-size: 12px; color: #757575; text-align: center;">You are receiving this because you are registered as a resident in this area on LocalPulse.</p>
        </div>
    </body>
    </html>
    """
    
    # We send to the configured SMTP_USER acting as the mailing list for that local area
    try:
        send_email_alert(SMTP_USER, f"LocalPulse Alert: {issue.get('title')}", html_content)
        return {"status": "success", "message": f"Notifications dispatched for issue {req.issue_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
