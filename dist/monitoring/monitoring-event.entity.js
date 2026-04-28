"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringEvent = exports.MonitoringEventType = void 0;
const typeorm_1 = require("typeorm");
var MonitoringEventType;
(function (MonitoringEventType) {
    MonitoringEventType["REGISTER_SUCCESS"] = "register_success";
    MonitoringEventType["LOGIN_SUCCESS"] = "login_success";
    MonitoringEventType["LOGIN_FAILED"] = "login_failed";
    MonitoringEventType["TOKEN_VALIDATE"] = "token_validate";
    MonitoringEventType["ACTIVITY"] = "activity";
    MonitoringEventType["LAST_ACTIVE"] = "last_active";
    MonitoringEventType["USERS_LIST"] = "users_list";
    MonitoringEventType["USER_DETAIL"] = "user_detail";
    MonitoringEventType["ACTIVE_USERS_LIST"] = "active_users_list";
    MonitoringEventType["ACTIVE_USERS_DETAIL"] = "active_users_detail";
})(MonitoringEventType || (exports.MonitoringEventType = MonitoringEventType = {}));
let MonitoringEvent = class MonitoringEvent {
};
exports.MonitoringEvent = MonitoringEvent;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: MonitoringEventType }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "actorUserId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "subjectUserId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 120 }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "route", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 16 }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], MonitoringEvent.prototype, "success", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], MonitoringEvent.prototype, "statusCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "ip", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 255 }),
    __metadata("design:type", String)
], MonitoringEvent.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], MonitoringEvent.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MonitoringEvent.prototype, "createdAt", void 0);
exports.MonitoringEvent = MonitoringEvent = __decorate([
    (0, typeorm_1.Entity)('monitoring_events')
], MonitoringEvent);
//# sourceMappingURL=monitoring-event.entity.js.map