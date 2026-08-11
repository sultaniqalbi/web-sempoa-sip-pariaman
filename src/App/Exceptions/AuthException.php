<?php

namespace App\Exceptions;

class AuthException extends AppException
{
    protected int $statusCode = 401;
}
