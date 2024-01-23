const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function list(req, res, next) {
    res.json({data: dishes })
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
        const {data={}} = req.body;
        if(data.hasOwnProperty(propertyName) && data[propertyName]!='') { 
            return next();
        }
        next({status: 400, message: `Order must include a ${propertyName}`});
    };
}

function validateFields (req, res, next) {
    const {data:{name, description, image_url} = {}} = req.body;
    if (name && name!='' ) {
        if (description && description!='') {
            if (image_url && image_url!='') {
                return next();
            } else {
                next({status:400, message:`Order must include an image_url`});
            }
        } else {
            next({status:400, message:`Order must include a description`});
        }
    } else {
        next({status:400, message:`Order must include a name`});
    }

}
function checkPrice(req, res, next) {
    const {data:{price}= {}} = req.body;
    if ((price <=0) || !price || !Number.isInteger(price)) {
        next({status: 400, message:`price is in the incorrect format: ${price}`})
    } 
    return next();
}

function create(req, res, next) {
    const {data: {name, description, image_url, price}={}} = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        image_url,
        price
    };
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

function dishExists (req, res, next) {
    const dishId = req.params.dishId;
    const foundDish = dishes.find((dish) => dish.id === dishId);

    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({status: 404, message:`Dish id not found: ${dishId}`});
}

function checkMatchingIdDeckId (req, res, next) {
    const dishId = req.params.dishId;
    const {data: {id}={}} = req.body;
    if (id && (id !== dishId)) {
        next({status: 400, message:`Dish id does not match: ${id}`});
    }
    return next();
}
function read(req, res, next) {
    const dish = res.locals.dish;
    res.json({data: dish});
}

function checkId (req, res, next) {
    const dishId = req.params.dishId;
    const dish = res.locals.dish;
    if (dish.id !== dishId) {

    }
}

function update(req, res, next) {
    const dish = res.locals.dish;
    const {data: {name, description, image_url, price} = {}} = req.body;

    dish.name=name;
    dish.description=description;
    dish.image_url=image_url;
    dish.price=price;

    res.json({data: dish});
}

function destroy (req, res, next) {
    next({status: 405, message: "Can't DELETE any dishes"});
}
module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
        checkPrice,
        create],
    list,
    read: [dishExists, read],
    update: [dishExists, 
        checkMatchingIdDeckId,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("image_url"),
            checkPrice,
            update],
    delete: [destroy],
}
