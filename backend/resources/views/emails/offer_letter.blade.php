<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admission Offer Letter - Arabic College</title>
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
            color: #10b981;
            margin: 0;
        }
        .content {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
        }
        .highlight-box {
            background-color: rgba(16, 185, 129, 0.1);
            border-left: 4px solid #10b981;
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
            <h1>Admission Offer Letter</h1>
        </div>
        <div class="content">
            <p>Dear {{ $name }},</p>
            <p>Congratulations! We are delighted to inform you that the admissions committee has approved your candidacy for enrollment at the Arabic College of Sharia and Linguistic Sciences.</p>
            <p>Based on your performance in the placement examinations, you have been selected for the following track:</p>
            
            <div class="highlight-box">
                <table>
                    <tr>
                        <td class="label">Candidate Name:</td>
                        <td><strong>{{ $name }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Academic Program:</td>
                        <td><strong>{{ $programName }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Application Ref:</td>
                        <td><strong>{{ $applicationNumber }}</strong></td>
                    </tr>
                    <tr>
                        <td class="label">Tuition Status:</td>
                        <td><strong>Scholarship eligible / Invoices generated</strong></td>
                    </tr>
                </table>
            </div>
            
            <p>To accept this offer and complete your student matriculation, please log in to your Portal Dashboard. You will find an option to review and accept your official offer letter and pay the initial semester registration invoice.</p>
            <p>We welcome you to our community of learning and scholarship.</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Arabic College of Sharia and Linguistic Sciences. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
