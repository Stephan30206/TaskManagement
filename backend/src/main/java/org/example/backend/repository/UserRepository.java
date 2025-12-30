package org.example.backend.repository;

import org.example.backend.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {

    // ✅ Exemple: MongoDB Shell vs Spring Data

    // MongoDB Shell: db.users.findOne({email: "email@example.com"})
    // Spring Data: findByEmail (convention de nommage)
    Optional<User> findByEmail(String email);

    // MongoDB Shell: db.users.findOne({phone: "0612345678"})
    Optional<User> findByPhone(String phone);

    // Recherche par nom avec LIKE
    // MongoDB Shell: db.users.find({firstName: {$regex: "jean", $options: "i"}})
    List<User> findByFirstNameContainingIgnoreCase(String firstName);

    // Recherche combinée
    List<User> findByFirstNameAndLastName(String firstName, String lastName);

    // Requête personnalisée avec @Query
    @Query("{'email': ?0, 'firstName': ?1}")
    Optional<User> findByEmailAndFirstName(String email, String firstName);

    // Recherche avec opérateurs
    @Query("{'createdAt': {$gte: ?0}}")
    List<User> findUsersCreatedAfter(Date date);

    @Query("{$or: ["
            + "{'firstName': {$regex: ?0, $options: 'i'}}, "
            + "{'lastName': {$regex: ?0, $options: 'i'}}, "
            + "{'email': {$regex: ?0, $options: 'i'}}"
            + "]}")
    List<User> findByFirstNameContainingOrLastNameContainingOrEmailContaining(String query, String query1, String query2);
}