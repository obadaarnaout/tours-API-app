const fs = require('fs');
const mongoose = require('mongoose');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/APIFeatures');
const catchAsync = require('./../utils/catchAsync');
const appError = require('./../utils/appErrors');

exports.getMonthlyPlan = catchAsync(async (req,res,next) => {
    const year = req.params.year * 1 || new Date().getFullYear()
    const plan = await Tour.aggregate([
        {
            $unwind: "$startDates"
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id:{
                    $month: '$startDates',
                },
                num: { $sum: 1 },
                tours: {
                    $push: {
                        name : '$name'
                    }
                },
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $sort: {
                num: -1
            }
        },
        {
            $limit: 5
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: plan
    });
});

exports.getToursStatus = catchAsync(async (req,res) => {
    const status = await Tour.aggregate([
        {
            $match: { ratingsAverage: {$gte: 4.5} }
        },
        {
            $group: { 
                _id: "$difficulty", 
                avgRating: { $avg: "$ratingsAverage" },
                maxPrice: { $max: "$price" },
                minPrice: { $min: "$price" },
                numRatings: { $sum: "$ratingsQuantity" },
                num: { $sum: 1 },
            }
        },
        {
            $sort: {maxPrice : -1}
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: status
    });
});

exports.getAllTours = catchAsync(async (req,res) => {
    
    // const t = JSON.parse(fs.readFileSync(__dirname + '/../dev-data/data/tours.json'));
    // t.map(item => {
    //     Tour.create(item);
    // });
    
    const features = new APIFeatures(Tour.find(),req.query);
    // show all details
    //const tours = await features.find().sort().filter().pagination(await Tour.countDocuments()).query.explain();
    const tours = await features.find().sort().filter().pagination(await Tour.countDocuments()).query;
    res.status(200).json({
        status: 'success',
        data: tours
    });
});
exports.getTop = catchAsync(async (req,res) => {
    const tours = await Tour.find().sort('-ratingsAverage').limit(5);

    res.status(201).json({
        status: 'success',
        data: tours
    });
});

exports.createTour = catchAsync(async (req,res,next) => {
    const newTour = await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data: newTour
    });
});

exports.getTourById = catchAsync(async (req,res,next) => {
    const tour = await Tour.findById(req.params.id).populate([{
        path: 'guides',
        select: '-__v'
    },
    {
        path: 'reviews',
        select: '-__v'
    }
    ]);
    if (!tour) {
        return next(new appError(404,'tour not found'));
    }
    
    res.status(200).json({
        status: 'success',
        data: tour
    });
});

exports.updateTour = catchAsync(async (req,res) => {
    const tour = await Tour.findByIdAndUpdate(req.params.id,req.body,{new: true,runValidators: true});
    res.status(200).json({
        status: 'success',
        data: tour
    });
});

exports.deleteTour = catchAsync(async (req,res) => {
    await Tour.findByIdAndDelete(req.params.id);
    res.status(204).json({
        status: 'success',
        message: 'Tour deleted successfully'
    });
});

exports.getToursWithin = catchAsync(async (req,res,next) => {

    if (!req.params.distance || !req.params.latlng || !req.params.unit) {
        return next(new appError(400,'distance , latlng , unit can not be empty'));
    }

    const {distance , latlng , unit} = req.params;

    const [lat,lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(new appError(400,'please provide lat , lng'));
    }

    const radius = unit == 'mi' ? distance / 3963.2 : distance / 6378.1;

    


    const tours = await Tour.aggregate([
        {
            $unwind: "$locations"
        },
        {
            $match: {
                locations: {
                    $geoWithin: {
                        $centerSphere: [ [ parseFloat(lng), parseFloat(lat) ], radius ]
                    }
                }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: tours
    });
});
exports.getToursDistance = catchAsync(async (req,res,next) => {

    if (!req.params.latlng || !req.params.unit) {
        return next(new appError(400,'distance , latlng , unit can not be empty'));
    }

    const {latlng , unit} = req.params;

    const [lat,lng] = latlng.split(',');

    if (!lat || !lng) {
        return next(new appError(400,'please provide lat , lng'));
    }

    //const radius = unit == 'mi' ? distance / 3963.2 : distance / 6378.1;

    


    const tours = await Tour.aggregate([
        {
            $unwind: "$locations"
        },
        {
            $match: {
                locations: {
                    near: { type: "Point", coordinates: [ parseFloat(lng) , parseFloat(lat) ] },
                    distanceField: "distance"
                }
            }
        },
        {
            $project: {
                distance: 1
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: tours
    });
});
