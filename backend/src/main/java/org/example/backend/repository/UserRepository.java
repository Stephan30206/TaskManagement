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

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    List<User> findByFirstNameContainingIgnoreCase(String firstName);

    List<User> findByFirstNameAndLastName(String firstName, String lastName);

    @Query("{'email': ?0, 'firstName': ?1}")
    Optional<User> findByEmailAndFirstName(String email, String firstName);

    @Query("{'createdAt': {$gte: ?0}}")
    List<User> findUsersCreatedAfter(Date date);

    @Query("{$or: ["
            + "{'firstName': {$regex: ?0, $options: 'i'}}, "
            + "{'lastName': {$regex: ?0, $options: 'i'}}, "
            + "{'email': {$regex: ?0, $options: 'i'}}"
            + "]}")
    List<User> findByFirstNameContainingOrLastNameContainingOrEmailContaining(String query, String query1, String query2);
}