<?php

namespace App\Exceptions;

class NotFoundException extends AppException
{
    protected int $statusCode = 404;

    public function __construct(string $message = 'Not Found')
    {
        parent::__construct($message, 404);
    }
}
