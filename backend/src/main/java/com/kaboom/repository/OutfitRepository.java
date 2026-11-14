package com.kaboom.repository;

import com.kaboom.model.Outfit;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutfitRepository extends JpaRepository<Outfit, String> {}
