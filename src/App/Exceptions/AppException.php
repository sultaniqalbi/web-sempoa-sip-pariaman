<?php

namespace App\Exceptions;

use Exception;

class AppException extends Exception
{
    protected int $statusCode = 500;

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
