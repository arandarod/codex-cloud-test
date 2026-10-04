package dev.entrelinhas.catalog;

import jakarta.validation.*;
import java.lang.annotation.*;
import java.time.Year;

@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PublicationYear.Validator.class)
public @interface PublicationYear {
    String message() default "O ano deve estar entre 1 e o ano atual.";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<PublicationYear, Integer> {
        @Override
        public boolean isValid(Integer value, ConstraintValidatorContext context) {
            return value == null || (value >= 1 && value <= Year.now().getValue());
        }
    }
}
