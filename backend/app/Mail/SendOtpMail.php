<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $purpose;

    /**
     * Create a new message instance.
     */
    public function __construct(string $otp, string $purpose)
    {
        $this->otp = $otp;
        $this->purpose = $purpose;
    }

    /**
     * Get the message envelope.
     */
    public function getEnvelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Verification Code: ' . $this->otp,
        );
    }

    /**
     * Get the message content definition.
     */
    public function getContent(): Content
    {
        return new Content(
            view: 'emails.otp',
        );
    }
}
