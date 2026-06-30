<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Interview Scheduled - Arabic College</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #090d16;
            color: #f1f5f9;
            margin: 0;
            padding: 40px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: rgba(17, 24, 39, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            font-size: 24px;
            color: #6366f1;
            margin: 0;
        }
        .content {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
        }
        .highlight-box {
            background-color: rgba(99, 102, 241, 0.1);
            border-left: 4px solid #6366f1;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
        }
        .highlight-box table {
            width: 100%;
            border-collapse: collapse;
        }
        .highlight-box td {
            padding: 6px 0;
            font-size: 14.5px;
            color: #f1f5f9;
        }
        .highlight-box td.label {
            color: #94a3b8;
            width: 35%;
            font-weight: 500;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Arabic College Admission</h1>
        </div>
        <div class="content">
            <p>Dear {{ $name }},</p>
            <p>We are pleased to inform you that your application for admission has been reviewed, and you have been scheduled for the placement entrance examination and oral interview.</p>
            <p>Please find your interview scheduling parameters detailed below:</p>
            
            <div class="highlight-box">
                <table>
                    <tr>
                        <td class="label">Academic Track:</td>
                        <td><strong>{{ $programName }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Date:</td>
                        <td><strong>{{ $interviewDate }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Time:</td>
                        <td><strong>{{ $interviewTime }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Location:</td>
                        <td><strong>Admissions Portal (Virtual Link inside dashboard)</strong></td>
                    </tr>
                </table>
            </div>
            
            <p>If you need to request a reschedule due to travel constraints, please notify the registrar office via the contact panel at least 48 hours prior to your scheduled slot.</p>
            <p>We wish you the absolute best in your entrance examinations.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Arabic College of Sharia and Linguistic Sciences. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
