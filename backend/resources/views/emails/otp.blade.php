<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verification Code</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0f172a;
            color: #f1f5f9;
            margin: 0;
            padding: 40px 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #1e293b;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            border: 1px solid #334155;
            text-align: center;
        }
        h2 {
            color: #818cf8;
            margin-bottom: 20px;
        }
        p {
            line-height: 1.6;
            color: #94a3b8;
            font-size: 16px;
        }
        .code-container {
            background: #0f172a;
            border: 2px dashed #4f46e5;
            padding: 15px 30px;
            border-radius: 12px;
            display: inline-block;
            margin: 25px 0;
        }
        .otp-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 6px;
            color: #ffffff;
            margin: 0;
        }
        .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #334155;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Arabic College of Sharia and Linguistic Sciences</h2>
        <p>You are receiving this email because you requested a verification code for <strong>{{ $purpose }}</strong>.</p>
        <p>Please use the following 6-digit verification code to complete the request. This code is valid for 15 minutes.</p>
        
        <div class="code-container">
            <div class="otp-code">{{ $otp }}</div>
        </div>
        
        <p>If you did not make this request, you can safely ignore this email.</p>
        
        <div class="footer">
            &copy; {{ date('Y') }} Arabic College. All rights reserved.
        </div>
    </div>
</body>
</html>
