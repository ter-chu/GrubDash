const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

function list (req, res, next) {
    res.json({data: orders});
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
    const {data:{deliverTo, mobileNumber, dishes} = {}} = req.body;
    if (deliverTo && deliverTo!='' ) {
        if (mobileNumber && mobileNumber!='') {
            return next();
        } else {
            next({status:400, message:`Order must include a mobileNumber`});
        }
    } else {
        next({status:400, message:`Order must include a deliverTo address`});
    }

}

function validateDish(req, res, next) {
    // res.locals.body = req.body;
    const {data:{dishes}= {}} = req.body;
    if (dishes.length>0 & Array.isArray(dishes)) {
        return next();
    } else {
        next({status:400, message:`Order must include a field: dishes`});
    }
    
    return next();
}

function validateDishQuantity(req, res, next) {
    const {data:{dishes}= {}} = req.body;

    for (dish in dishes) {
        let oneDish = dishes[dish];
        if (!oneDish.hasOwnProperty("quantity") || oneDish.quantity<=0 
                || !Number.isInteger(oneDish.quantity)) {
            next({status: 400, message:`Dish ${dish} must have a quantity that is an integer greateer than 0`});
        }
    }
    return next();

}

function validStatus(req, res, next) {
    const { data: {status}} = req.body;
    const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (validStatus.includes(status)) {
        return next();
    }
    next({
        status: 400,
        message: `Value of the 'status' property must be one of ${validStatus}.`,
      });
}   

function create(req, res, next) {
    const {data:{deliverTo, mobileNumber, dishes, quantity} = {}} = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        dishes,
        quantity
    };
    orders.push(newOrder);
    res.status(201).json({data: newOrder});
}

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    const foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({status: 404, message:`Order id not found: ${orderId}`});
}
 
function read (req, res, next) {
    const order = res.locals.order;
    res.json({data: order});
}

function update (req, res, next) {
    const order = res.locals.order;
    const {data: {deliverTo, mobileNumber, dishes, quantity} = {}} = req.body;

    order.deliverTo=deliverTo;
    order.mobileNumber=mobileNumber;
    order.dishes=dishes;
    order.quantity=quantity;

    res.json({data: order});
}

function validateDestroyOrders (req, res, next) {
    const orderId = req.params.orderId;
    const order = res.locals.order;
    if (order.status === "pending") {
        return next();
    }
    next({status: 400, message:`Only able to delete pending orders: ${orderId}`})
}

function checkMatchingId(req, res, next) {
    const orderId = req.params.orderId;
    const {data: {id}={}} = req.body;
    if (id && (orderId !== id)) {
        next({status: 400, message:`Order id does not match: ${id}`});
    }
    return next();
}
function destroy (req, res, next) {
    const orderId = req.params.orderId;
    const index = orders.findIndex((order) => order.id === orderId);
    const order = res.locals.order;
    // console.log(orderId, index, order.id);
    if (orderId === order.id) {
        const deletedOrders = orders.splice(index, 1);
        res.sendStatus(204);
    }
    
};

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        validateDish,
        validateDishQuantity,
        create],
    list,
    read: [orderExists, read],
    update: [orderExists,
        checkMatchingId,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        bodyDataHas("status"),
        validateDish,
        validateDishQuantity,
        validStatus,
        update
    ],
    delete: [orderExists, 
        validateDestroyOrders,
        destroy]
}