<?php

namespace App\Exceptions;

class HttpException extends AppException
{
    public function __construct(int $statusCode = 500, string $message = '')
    {
        $this->statusCode = $statusCode;
        if (empty($message)) {
            $message = "HTTP Error {$statusCode}";
        }
        parent::__construct($message, $statusCode);
    }
}
