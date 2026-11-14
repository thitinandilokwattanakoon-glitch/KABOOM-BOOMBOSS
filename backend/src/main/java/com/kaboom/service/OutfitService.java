package com.kaboom.service;

import com.kaboom.dto.OutfitDtos.OutfitDto;
import com.kaboom.model.Outfit;
import com.kaboom.repository.OutfitRepository;
import java.util.Optional;
import org.springframework.stereotype.Service;

/** Saves and reads the dress-up character of a student. */
@Service
public class OutfitService {

    private final OutfitRepository outfits;

    public OutfitService(OutfitRepository outfits) {
        this.outfits = outfits;
    }

    /** Empty when the student has never saved a character (the frontend then shows the default one). */
    public Optional<OutfitDto> find(String studentId) {
        return outfits.findById(studentId).map(OutfitService::toDto);
    }

    public OutfitDto save(String studentId, OutfitDto d) {
        Outfit o = outfits.findById(studentId).orElseGet(() -> new Outfit(studentId));
        o.wear(d.skin(), d.face(),
                d.hair(), d.hairColor(),
                d.hat(), d.hatColor(),
                d.top(), d.topColor(),
                d.bottom(), d.bottomColor(),
                d.shoes(), d.shoesColor(),
                d.accessory(), d.accessoryColor(),
                d.bag(), d.bagColor(),
                d.faceArt() == null || d.faceArt().isEmpty() ? null : d.faceArt());
        return toDto(outfits.save(o));
    }

    private static OutfitDto toDto(Outfit o) {
        return new OutfitDto(o.getSkin(), o.getFace(),
                o.getHair(), o.getHairColor(),
                o.getHat(), o.getHatColor(),
                o.getTop(), o.getTopColor(),
                o.getBottom(), o.getBottomColor(),
                o.getShoes(), o.getShoesColor(),
                o.getAccessory(), o.getAccessoryColor(),
                o.getBag(), o.getBagColor(),
                o.getFaceArt() == null ? "" : o.getFaceArt());
    }
}
