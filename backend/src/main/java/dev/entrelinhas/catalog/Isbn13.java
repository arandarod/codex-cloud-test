package dev.entrelinhas.catalog;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = Isbn13.Validator.class)
public @interface Isbn13 {
    String message() default "Informe um ISBN-13 válido, incluindo o dígito verificador.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<Isbn13, String> {
        @Override
        public boolean isValid(String value, ConstraintValidatorContext context) {
            if (value == null || value.isBlank()) return true;
            if (!value.matches("97[89][0-9]{10}")) return false;
            var sum = 0;
            for (var i = 0; i < 13; i++) sum += (value.charAt(i) - '0') * (i % 2 == 0 ? 1 : 3);
            return sum % 10 == 0;
        }
    }
}
