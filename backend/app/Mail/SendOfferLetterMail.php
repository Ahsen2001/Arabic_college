<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendOfferLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $name;
    public string $programName;
    public string $applicationNumber;

    /**
     * Create a new message instance.
     */
    public function __construct(string $name, string $programName, string $applicationNumber)
    {
        $this->name = $name;
        $this->programName = $programName;
        $this->applicationNumber = $applicationNumber;
    }

    /**
     * Get the message envelope.
     */
    public function getEnvelope(): Envelope
    {
        return new Envelope(
            subject: 'Congratulations! Admission Offer from Arabic College',
        );
    }

    /**
     * Get the message content definition.
     */
    public function getContent(): Content
    {
        return new Content(
            view: 'emails.offer_letter',
        );
    }
}
