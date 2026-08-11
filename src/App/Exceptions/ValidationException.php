<?php

namespace App\Exceptions;

class ValidationException extends AppException
{
    protected int $statusCode = 422;
    protected array $errors = [];

    public function __construct($errors, string $message = 'Validation failed')
    {
        if (is_array($errors)) {
            $this->errors = $errors;
        } else {
            $this->errors = ['general' => $errors];
            $message = (string) $errors;
        }

        parent::__construct($message, 422);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
