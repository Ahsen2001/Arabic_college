<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendInterviewScheduleMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $name;
    public string $interviewDate;
    public string $interviewTime;
    public string $programName;

    /**
     * Create a new message instance.
     */
    public function __construct(string $name, string $interviewDate, string $interviewTime, string $programName)
    {
        $this->name = $name;
        $this->interviewDate = $interviewDate;
        $this->interviewTime = $interviewTime;
        $this->programName = $programName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Arabic College Admission - Interview Scheduled',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.interview_schedule',
        );
    }
}
