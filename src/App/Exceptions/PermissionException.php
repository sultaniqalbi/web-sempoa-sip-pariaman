<?php

namespace App\Exceptions;

class PermissionException extends AppException
{
    protected int $statusCode = 403;

    public function __construct(string $message = 'Access Denied')
    {
        parent::__construct($message, 403);
    }
}
