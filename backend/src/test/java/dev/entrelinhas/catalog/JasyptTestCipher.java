package dev.entrelinhas.catalog;

import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;
import org.jasypt.iv.RandomIvGenerator;
import org.jasypt.salt.RandomSaltGenerator;

final class JasyptTestCipher {
    private JasyptTestCipher() {}

    static String encrypt(String value, String master) {
        var encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword(master);
        encryptor.setAlgorithm("PBEWITHHMACSHA512ANDAES_256");
        encryptor.setKeyObtentionIterations(1_000);
        encryptor.setSaltGenerator(new RandomSaltGenerator());
        encryptor.setIvGenerator(new RandomIvGenerator());
        return "ENC(" + encryptor.encrypt(value) + ")";
    }
}
