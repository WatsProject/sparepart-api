import { sparepartsRepository } from "../database/repository/spareparts.js";
import { BadRequestError, ConflictError, NotFoundError } from "../errors.js";

export const sparepartsService = {
  async getAllSpareparts() {
    return await sparepartsRepository.getAllSpareparts();
  },

  async getSparepartById(id) {
    const sparepart = await sparepartsRepository.findById(id);

    if (!sparepart) {
      throw new NotFoundError("Sparepart tidak ditemukan");
    }

    return sparepart;
  },

  async getSparepartsByName(name) {
    if (!name) {
      throw new BadRequestError("Nama sparepart harus diisi");
    }

    return await sparepartsRepository.findByName(name);
  },

  async createSparepart(
    kode,
    name,
    brand = null,
    unit = "pcs",
    category_id = null,
    supplier_id = null,
    buy_price = 0,
    sell_price = 0,
    stock = 0,
    min_stock = 0,
    description = null,
  ) {
    if (!kode || !name) {
      throw new BadRequestError("Kode dan nama sparepart harus diisi");
    }

    const existingSparepart = await sparepartsRepository.findByKode(kode);

    if (existingSparepart) {
      throw new ConflictError("Kode sparepart sudah digunakan");
    }

    if (buy_price < 0 || sell_price < 0) {
      throw new BadRequestError("Harga tidak boleh kurang dari 0");
    }

    if (stock < 0 || min_stock < 0) {
      throw new BadRequestError("Stok tidak boleh kurang dari 0");
    }

    const id = await sparepartsRepository.createSparepart(
      kode,
      name,
      brand,
      unit,
      category_id,
      supplier_id,
      buy_price,
      sell_price,
      stock,
      min_stock,
      description,
    );

    return await sparepartsRepository.findById(id);
  },

  async updateSparepart(
    id,
    kode,
    name,
    brand = null,
    unit = "pcs",
    category_id = null,
    supplier_id = null,
    buy_price = 0,
    sell_price = 0,
    stock = 0,
    min_stock = 0,
    description = null,
  ) {
    const sparepart = await sparepartsRepository.findById(id);

    if (!sparepart) {
      throw new NotFoundError("Sparepart tidak ditemukan");
    }

    if (!kode || !name) {
      throw new BadRequestError("Kode dan nama sparepart harus diisi");
    }

    const existingSparepart = await sparepartsRepository.findByKode(kode);

    if (existingSparepart && existingSparepart.id !== Number(id)) {
      throw new ConflictError("Kode sparepart sudah digunakan");
    }

    if (buy_price < 0 || sell_price < 0) {
      throw new BadRequestError("Harga tidak boleh kurang dari 0");
    }

    if (stock < 0 || min_stock < 0) {
      throw new BadRequestError("Stok tidak boleh kurang dari 0");
    }

    await sparepartsRepository.updateSparepart(
      id,
      kode,
      name,
      brand,
      unit,
      category_id,
      supplier_id,
      buy_price,
      sell_price,
      stock,
      min_stock,
      description,
    );

    return await sparepartsRepository.findById(id);
  },

  async deleteSparepart(id) {
    const sparepart = await sparepartsRepository.findById(id);

    if (!sparepart) {
      throw new NotFoundError("Sparepart tidak ditemukan");
    }

    return await sparepartsRepository.deleteSparepart(id);
  },
};
