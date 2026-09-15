package com.demo.annonces.common;

import com.demo.annonces.annonce.AnnonceNotFoundException;
import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Single error contract for the whole API: RFC 9457 ProblemDetail, plus an {@code errors}
 * property ({@code [{field, message}]}) on 400s so the frontend can map messages onto form fields.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    public record FieldMessage(String field, String message) {
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        List<FieldMessage> errors = ex.getBindingResult().getFieldErrors().stream()
                .sorted(Comparator.comparing(FieldError::getField))
                .map(fe -> new FieldMessage(fe.getField(),
                        fe.getDefaultMessage() == null ? "Valeur invalide" : fe.getDefaultMessage()))
                .toList();
        return badRequest("Requête invalide", errors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleUnreadable(HttpMessageNotReadableException ex) {
        String message = String.valueOf(ex.getMostSpecificCause().getMessage());
        List<FieldMessage> errors = message.contains("Category")
                ? List.of(new FieldMessage("category", "Catégorie inconnue"))
                : List.of();
        return badRequest("Corps de requête illisible", errors);
    }

    @ExceptionHandler(AnnonceNotFoundException.class)
    public ProblemDetail handleNotFound(AnnonceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Annonce introuvable");
        return problem;
    }

    private static ProblemDetail badRequest(String title, List<FieldMessage> errors) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setTitle(title);
        problem.setProperty("errors", errors);
        return problem;
    }
}
