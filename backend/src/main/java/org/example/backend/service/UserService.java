package org.example.backend.service;

import org.example.backend.model.User;
import org.example.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // CRÉATION D'UTILISATEUR
    public User createUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email déjà utilisé");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCreatedAt(new Date());
        user.setUpdatedAt(new Date());
        return userRepository.save(user);
    }

    // RÉCUPÉRATION PAR ID
    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    // RÉCUPÉRATION PAR EMAIL
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // LISTE DE TOUS LES UTILISATEURS
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // MISE À JOUR D'UTILISATEUR
    public User updateUser(String id, User userDetails) {
        return userRepository.findById(id).map(existingUser -> {
            // Ne pas permettre la modification de l'email
            if (userDetails.getFirstName() != null) {
                existingUser.setFirstName(userDetails.getFirstName());
            }
            if (userDetails.getLastName() != null) {
                existingUser.setLastName(userDetails.getLastName());
            }
            if (userDetails.getPhone() != null) {
                existingUser.setPhone(userDetails.getPhone());
            }
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }

            existingUser.setUpdatedAt(new Date());
            return userRepository.save(existingUser);
        }).orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    }

    // SUPPRESSION D'UTILISATEUR
    @Transactional
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    // VÉRIFICATION D'EXISTENCE D'EMAIL
    public boolean existsByEmail(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    // RECHERCHE D'UTILISATEURS
    public List<User> searchUsers(String query) {
        // Recherche par nom, prénom ou email
        return userRepository.findByFirstNameContainingOrLastNameContainingOrEmailContaining(
                query, query, query);
    }

    // COMPTE D'UTILISATEURS
    public long countUsers() {
        return userRepository.count();
    }

    // MISE À JOUR DU MOT DE PASSE
    public boolean updatePassword(String userId, String currentPassword, String newPassword) {
        return userRepository.findById(userId).map(user -> {
            if (passwordEncoder.matches(currentPassword, user.getPassword())) {
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setUpdatedAt(new Date());
                userRepository.save(user);
                return true;
            }
            return false;
        }).orElse(false);
    }

    // RÉINITIALISATION DE MOT DE PASSE
    public boolean resetPassword(String email, String newPassword) {
        return userRepository.findByEmail(email).map(user -> {
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setUpdatedAt(new Date());
            userRepository.save(user);
            return true;
        }).orElse(false);
    }
}