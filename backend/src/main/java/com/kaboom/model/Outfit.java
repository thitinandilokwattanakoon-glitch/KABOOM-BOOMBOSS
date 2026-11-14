package com.kaboom.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * What the dress-up character of a student wears. The id is the student id, so each student has at most one.
 * Items are short ids ("cap", "hoodie", "none", ...) and colours are positions in the palettes; both lists
 * live in the frontend (game/avatar.ts), which also falls back to a default for anything it does not know.
 */
@Entity
@Table(name = "outfits")
public class Outfit {

    @Id
    private String id;

    @Column(nullable = false)
    private int skin;

    @Column(name = "face_item", nullable = false)
    private String face;

    @Column(name = "hair_item", nullable = false)
    private String hair;

    @Column(name = "hair_color", nullable = false)
    private int hairColor;

    @Column(name = "hat_item", nullable = false)
    private String hat;

    @Column(name = "hat_color", nullable = false)
    private int hatColor;

    @Column(name = "top_item", nullable = false)
    private String top;

    @Column(name = "top_color", nullable = false)
    private int topColor;

    @Column(name = "bottom_item", nullable = false)
    private String bottom;

    @Column(name = "bottom_color", nullable = false)
    private int bottomColor;

    @Column(name = "shoes_item", nullable = false)
    private String shoes;

    @Column(name = "shoes_color", nullable = false)
    private int shoesColor;

    @Column(name = "accessory_item", nullable = false)
    private String accessory;

    @Column(name = "accessory_color", nullable = false)
    private int accessoryColor;

    @Column(name = "bag_item", nullable = false)
    private String bag;

    @Column(name = "bag_color", nullable = false)
    private int bagColor;

    /** The face the student drew: digits, commas and semicolons only (see game/avatar.ts). Null = none. */
    @Column(name = "face_art", length = 12000)
    private String faceArt;

    @Column(name = "updated_at", nullable = false)
    private long updatedAt;

    protected Outfit() {}

    public Outfit(String studentId) {
        this.id = studentId;
    }

    public void wear(int skin, String face,
                     String hair, int hairColor,
                     String hat, int hatColor,
                     String top, int topColor,
                     String bottom, int bottomColor,
                     String shoes, int shoesColor,
                     String accessory, int accessoryColor,
                     String bag, int bagColor,
                     String faceArt) {
        this.skin = skin;
        this.face = face;
        this.hair = hair;
        this.hairColor = hairColor;
        this.hat = hat;
        this.hatColor = hatColor;
        this.top = top;
        this.topColor = topColor;
        this.bottom = bottom;
        this.bottomColor = bottomColor;
        this.shoes = shoes;
        this.shoesColor = shoesColor;
        this.accessory = accessory;
        this.accessoryColor = accessoryColor;
        this.bag = bag;
        this.bagColor = bagColor;
        this.faceArt = faceArt;
        this.updatedAt = System.currentTimeMillis();
    }

    public String getId() { return id; }
    public int getSkin() { return skin; }
    public String getFace() { return face; }
    public String getHair() { return hair; }
    public int getHairColor() { return hairColor; }
    public String getHat() { return hat; }
    public int getHatColor() { return hatColor; }
    public String getTop() { return top; }
    public int getTopColor() { return topColor; }
    public String getBottom() { return bottom; }
    public int getBottomColor() { return bottomColor; }
    public String getShoes() { return shoes; }
    public int getShoesColor() { return shoesColor; }
    public String getAccessory() { return accessory; }
    public int getAccessoryColor() { return accessoryColor; }
    public String getBag() { return bag; }
    public int getBagColor() { return bagColor; }
    public String getFaceArt() { return faceArt; }
    public long getUpdatedAt() { return updatedAt; }
}
