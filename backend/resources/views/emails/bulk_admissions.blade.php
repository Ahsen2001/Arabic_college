<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Academic Update - Arabic College</title>
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
            color: #818cf8;
            margin: 0;
        }
        .content {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
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
            <h1>Arabic College Office of Admissions</h1>
        </div>
        <div class="content">
            <p>{!! nl2br(e($bodyText)) !!}</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} Arabic College of Sharia and Linguistic Sciences. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
