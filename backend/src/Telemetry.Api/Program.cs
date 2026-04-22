using Microsoft.EntityFrameworkCore;
using Telemetry.Api.Models;
using Telemetry.Api.Services;
using System.Threading.Channels;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.Configure<Telemetry.Api.Configuration.TelemetryOptions>(
    builder.Configuration.GetSection("TelemetryOptions"));
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

// Add EF Core Sqlite

builder.Services.AddDbContext<Telemetry.Api.Services.TelemetryDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("TelemetryDb") ?? "Data Source=telemetry.db"));
builder.Services.AddScoped<Telemetry.Api.Services.TelemetryRepository>();

var channel = Channel.CreateUnbounded<TelemetrySample>();
builder.Services.AddSingleton(channel);
builder.Services.AddHostedService<TelemetryGeneratorWorker>();
builder.Services.AddHostedService<TelemetryDispatchWorker>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<Telemetry.Api.Services.TelemetryDbContext>();
    db.Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.MapControllers();
app.MapHub<Telemetry.Api.Hubs.TelemetryHub>("/telemetryHub");

app.Run();
